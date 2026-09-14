"""
Tests for the upgraded production pipeline.
Validates schema chains, Pydantic output models, rule engine guardrails,
and workflow graph structure.
"""
import pytest
from app.schemas.news import (
    RawArticle, RelevantArticle, ValidatedArticle,
    Story, ScoredStory, Summary,
    TopicAnalysis, ImpactAnalysis, EntityAnalysis, SentimentAnalysis,
    AgentLog, Alert,
)
from app.schemas.agent_outputs import (
    DiscoveryOutput, DiscoveryItem,
    ValidationOutput, ValidationItem,
    ClusterOutput, ClusterItem,
    TopicOutput, TopicItem,
    ImpactOutput, ImpactItem,
    EntityOutput, EntityItem,
    SentimentOutput, SentimentItem,
    SummaryOutput, SummaryItem,
)
from app.schemas.analysis import ImportanceSignals, RuleEngineResult
from app.services import rule_engine


# ─── Helpers ────────────────────────────────────────────────────────────────

def _raw_article(**overrides):
    defaults = dict(
        id='a1', title='Test story', url='https://example.com/a',
        source='Example', published_at='2026-09-11T00:00:00Z',
    )
    defaults.update(overrides)
    return RawArticle(**defaults)


def _story(**overrides):
    defaults = dict(
        story_id='story-1', title='Test', article_ids=['a1'], sources=['Example'],
        representative_url='https://example.com', narrative='Test', first_published_at='2026-09-11T00:00:00Z',
    )
    defaults.update(overrides)
    return Story(**defaults)


# ─── Test: Schema chain (original test preserved + extended) ─────────────────

def test_schema_chain():
    a = _raw_article()
    r = RelevantArticle(**a.model_dump(), relevance_score=90, relevance_reason='direct match')
    v = ValidatedArticle(**r.model_dump(), validation_status='valid', validation_confidence=.9,
                         validation_reason='context matches', credibility_score=85)
    s = Story(story_id='story-1', title=v.title, article_ids=[v.id], sources=[v.source],
              representative_url=v.url, narrative=v.title, first_published_at=v.published_at)
    ss = ScoredStory(**s.model_dump(), importance_score=80, impact_level='high', urgency='high',
                     impact_signals=['multi-source'], sentiment='neutral')
    sm = Summary(story_id=ss.story_id, headline=ss.title, executive_summary='Grounded summary.',
                 key_facts=['Fact 1'], recommended_action='Monitor.')
    assert sm.story_id == 'story-1'


# ─── Test: Pydantic agent output models ──────────────────────────────────────

def test_discovery_output_validation():
    data = {'items': [{'index': 0, 'relevance_score': 85.0, 'relevance_reason': 'direct', 'confidence': 0.9}]}
    out = DiscoveryOutput.model_validate(data)
    assert len(out.items) == 1
    assert out.items[0].relevance_score == 85.0
    assert out.items[0].confidence == 0.9


def test_validation_output():
    data = {'items': [{'index': 0, 'classification': 'valid', 'confidence': 0.88,
                       'reason': 'matches', 'credibility_score': 90}]}
    out = ValidationOutput.model_validate(data)
    assert out.items[0].classification == 'valid'


def test_cluster_output():
    data = {'items': [{'article_indices': [0, 1, 2], 'narrative': 'Same event', 'confidence': 0.85}]}
    out = ClusterOutput.model_validate(data)
    assert len(out.items[0].article_indices) == 3


def test_impact_output_clamping():
    data = {'items': [{'index': 0, 'business_impact': 8.5, 'urgency': 9.0, 'market_impact': 7.0,
                       'novelty': 6.0, 'confidence': 0.92, 'sentiment': 'negative',
                       'impact_signals': ['multi-source', 'breaking']}]}
    out = ImpactOutput.model_validate(data)
    assert out.items[0].sentiment == 'negative'


def test_sentiment_output():
    data = {'items': [{'index': 0, 'sentiment': 'positive', 'polarity_score': 0.75,
                       'confidence': 0.88, 'reasoning': 'Bullish signals'}]}
    out = SentimentOutput.model_validate(data)
    assert out.items[0].polarity_score == 0.75


def test_entity_output():
    data = {'items': [{'index': 0, 'companies': ['OpenAI'], 'people': ['Sam Altman'],
                       'geographies': ['San Francisco'], 'technologies': ['GPT-4']}]}
    out = EntityOutput.model_validate(data)
    assert 'OpenAI' in out.items[0].companies


def test_summary_output():
    data = {'items': [{'index': 0, 'headline': 'Test', 'executive_summary': 'Summary',
                       'key_facts': ['Fact 1'], 'recommended_action': 'Monitor'}]}
    out = SummaryOutput.model_validate(data)
    assert out.items[0].headline == 'Test'


# ─── Test: Rule Engine scoring + CRITICAL guardrail ──────────────────────────

def test_rule_engine_high_score():
    signals = ImportanceSignals(
        story_id='s1', business_impact=8.5, urgency=9.0,
        market_impact=7.5, novelty=6.0, confidence=0.9,
    )
    result = rule_engine.score(signals, source_reliability=0.85)
    assert result.priority in ('CRITICAL', 'HIGH')
    assert result.weighted_score > 0
    assert result.final_score > 0
    assert result.should_alert is True


def test_rule_engine_low_score():
    signals = ImportanceSignals(
        story_id='s2', business_impact=2.0, urgency=2.0,
        market_impact=1.5, novelty=3.0, confidence=0.5,
    )
    result = rule_engine.score(signals, source_reliability=0.5)
    assert result.priority == 'LOW'
    assert result.should_alert is False


def test_critical_guardrail_low_reliability():
    """CRITICAL should be demoted to HIGH if source_reliability < 0.75."""
    signals = ImportanceSignals(
        story_id='s3', business_impact=10.0, urgency=10.0,
        market_impact=10.0, novelty=10.0, confidence=0.95,
    )
    result = rule_engine.score(signals, source_reliability=0.60)
    assert result.priority == 'HIGH', 'CRITICAL should be demoted to HIGH for low reliability sources'


def test_critical_guardrail_low_confidence():
    """CRITICAL should be demoted to HIGH if confidence < 0.80."""
    signals = ImportanceSignals(
        story_id='s4', business_impact=10.0, urgency=10.0,
        market_impact=10.0, novelty=10.0, confidence=0.70,
    )
    result = rule_engine.score(signals, source_reliability=0.90)
    assert result.priority == 'HIGH', 'CRITICAL should be demoted to HIGH for low confidence'


def test_critical_guardrail_passes():
    """CRITICAL should stay CRITICAL when both reliability and confidence are high."""
    signals = ImportanceSignals(
        story_id='s5', business_impact=10.0, urgency=10.0,
        market_impact=10.0, novelty=10.0, confidence=0.95,
    )
    result = rule_engine.score(signals, source_reliability=0.90)
    assert result.priority == 'CRITICAL'


# ─── Test: Graph structure ───────────────────────────────────────────────────

def test_graph_has_all_agent_stages():
    from app.graph.workflow import build_graph
    g = build_graph()
    names = set(g.nodes.keys())
    expected = {'discover', 'validate', 'cluster', 'topic', 'impact', 'entity', 'sentiment', 'importance', 'summary'}
    assert expected <= names, f'Missing nodes: {expected - names}'


def test_graph_has_sentiment_node():
    """Verify the sentiment agent is wired into the graph (bug fix #3)."""
    from app.graph.workflow import build_graph
    g = build_graph()
    assert 'sentiment' in g.nodes, 'Sentiment node must be wired into the workflow'


# ─── Test: Source reliability ────────────────────────────────────────────────

def test_source_reliability_known():
    from app.services.source_reliability import get_reliability
    assert get_reliability('Reuters') >= 0.90
    assert get_reliability('Medium') < 0.70


def test_source_reliability_unknown():
    from app.services.source_reliability import get_reliability
    assert get_reliability('randomnewsblog.xyz') == 0.35


# ─── Test: Alert model ──────────────────────────────────────────────────────

def test_alert_model():
    alert = Alert(
        alert_id='a1', story_id='s1', priority='CRITICAL',
        title='Test', reason='High urgency', importance_score=9.5,
        sources=['Reuters'], url='https://example.com', triggered_at='2026-09-11T00:00:00Z',
    )
    assert alert.priority == 'CRITICAL'
    assert alert.importance_score == 9.5
