import json
import os
import networkx as nx
import logging

logger = logging.getLogger(__name__)

class GraphEngine:
    def __init__(self):
        self.graph = nx.DiGraph()
        self._build_graph()

    def _build_graph(self):
        file_path = os.path.join(os.path.dirname(__file__), "..", "data", "knowledge_graph.json")
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
                
            for parent, children in data.items():
                self.graph.add_node(parent)
                for child in children:
                    self.graph.add_node(child)
                    # Edge points from Child -> Parent (e.g., Whey -> Dairy)
                    # This lets us start at a label ingredient and walk UP to the root allergen
                    self.graph.add_edge(child, parent)
                    
            logger.info(f"Knowledge graph built: {self.graph.number_of_nodes()} nodes, {self.graph.number_of_edges()} edges.")
        except Exception as e:
            logger.error(f"Failed to load knowledge graph: {e}")

    def check_for_allergen(self, ingredient: str, target_allergen: str) -> bool:
        """
        Checks if an ingredient traces back to the target_allergen using graph traversal.
        """
        ingredient = ingredient.lower()
        target_allergen = target_allergen.lower().replace(" ", "_")
        
        if ingredient not in self.graph or target_allergen not in self.graph:
            return False
            
        try:
            return nx.has_path(self.graph, ingredient, target_allergen)
        except nx.NetworkXError:
            return False
            
    def get_all_aliases(self, target_allergen: str) -> list[str]:
        """
        Given a root allergen, get all possible descending ingredients by reversing the graph 
        and finding all descendants.
        """
        target_allergen = target_allergen.lower().replace(" ", "_")
        if target_allergen not in self.graph:
            return [target_allergen]
            
        # Reverse the graph to walk down from Allergen -> Ingredients
        reversed_graph = self.graph.reverse()
        descendants = list(nx.descendants(reversed_graph, target_allergen))
        descendants.append(target_allergen) # Include the root itself
        return descendants
