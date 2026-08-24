import sys
import os
import json
import networkx as nx
import matplotlib.pyplot as plt

def draw_graph():
    file_path = os.path.join(os.path.dirname(__file__), "..", "app", "data", "knowledge_graph.json")
    with open(file_path, 'r') as f:
        data = json.load(f)
        
    G = nx.DiGraph()
    for parent, children in data.items():
        # Add edges pointing from Parent to Child for easier reading
        for child in children:
            G.add_edge(parent, child)

    plt.figure(figsize=(14, 10))
    
    # Spring layout for an organic look
    pos = nx.spring_layout(G, k=0.7, iterations=50, seed=42)
    
    # Root allergens (keys in the JSON) are colored coral, ingredients are lightblue
    node_colors = ['#ff7f50' if node in data else '#87cefa' for node in G.nodes()]
    
    nx.draw(G, pos, with_labels=True, node_color=node_colors, 
            node_size=2500, font_size=10, font_weight='bold', 
            arrows=True, arrowsize=20, edge_color='#a0a0a0', width=1.5)
            
    plt.title("Buywise - Ingredient Knowledge Graph", fontsize=20, fontweight='bold', pad=20)
    
    # Save the output directly to your artifact directory so it can be shown in chat
    output_path = r"C:\Users\sahel\.gemini\antigravity-cli\brain\eeb8f246-ff5e-4ca1-a3c2-f43a89537fb7\knowledge_graph.png"
    plt.savefig(output_path, format="png", dpi=300, bbox_inches='tight')
    print(f"Graph saved to {output_path}")

if __name__ == "__main__":
    draw_graph()
