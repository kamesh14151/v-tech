from app.graph.workflow import build_graph

def test_graph_has_five_agent_stages():
    g=build_graph()
    names=set(g.nodes.keys())
    assert {'discover','validate','cluster','importance','summary'} <= names

def test_graph_has_parallel_fan_out():
    """Verify 4-way parallel fan-out: cluster → [topic, impact, entity, sentiment]."""
    g = build_graph()
    names = set(g.nodes.keys())
    parallel = {'topic', 'impact', 'entity', 'sentiment'}
    assert parallel <= names, f'Missing parallel nodes: {parallel - names}'
