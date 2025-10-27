// Graph algorithms implementation
#include <iostream>
#include <vector>
#include <queue>
#include <stack>
#include <limits>
#include <algorithm>

namespace graph {

class Graph {
private:
    int V; // Number of vertices
    std::vector<std::vector<int>> adj; // Adjacency list
    
public:
    Graph(int vertices) : V(vertices) {
        adj.resize(V);
    }
    
    void addEdge(int v, int w) {
        adj[v].push_back(w);
    }
    
    // Breadth-First Search
    void BFS(int start) {
        std::vector<bool> visited(V, false);
        std::queue<int> queue;
        
        visited[start] = true;
        queue.push(start);
        
        while (!queue.empty()) {
            int v = queue.front();
            std::cout << v << " ";
            queue.pop();
            
            for (int neighbor : adj[v]) {
                if (!visited[neighbor]) {
                    visited[neighbor] = true;
                    queue.push(neighbor);
                }
            }
        }
        std::cout << std::endl;
    }
    
    // Depth-First Search Helper
    void DFSUtil(int v, std::vector<bool>& visited) {
        visited[v] = true;
        std::cout << v << " ";
        
        for (int neighbor : adj[v]) {
            if (!visited[neighbor]) {
                DFSUtil(neighbor, visited);
            }
        }
    }
    
    // Depth-First Search
    void DFS(int start) {
        std::vector<bool> visited(V, false);
        DFSUtil(start, visited);
        std::cout << std::endl;
    }
    
    // Topological Sort Helper
    void topologicalSortUtil(int v, std::vector<bool>& visited, std::stack<int>& stack) {
        visited[v] = true;
        
        for (int neighbor : adj[v]) {
            if (!visited[neighbor]) {
                topologicalSortUtil(neighbor, visited, stack);
            }
        }
        
        stack.push(v);
    }
    
    // Topological Sort
    void topologicalSort() {
        std::stack<int> stack;
        std::vector<bool> visited(V, false);
        
        for (int i = 0; i < V; i++) {
            if (!visited[i]) {
                topologicalSortUtil(i, visited, stack);
            }
        }
        
        while (!stack.empty()) {
            std::cout << stack.top() << " ";
            stack.pop();
        }
        std::cout << std::endl;
    }
    
    // Detect cycle in directed graph
    bool isCyclicUtil(int v, std::vector<bool>& visited, std::vector<bool>& recStack) {
        if (!visited[v]) {
            visited[v] = true;
            recStack[v] = true;
            
            for (int neighbor : adj[v]) {
                if (!visited[neighbor] && isCyclicUtil(neighbor, visited, recStack)) {
                    return true;
                } else if (recStack[neighbor]) {
                    return true;
                }
            }
        }
        recStack[v] = false;
        return false;
    }
    
    bool isCyclic() {
        std::vector<bool> visited(V, false);
        std::vector<bool> recStack(V, false);
        
        for (int i = 0; i < V; i++) {
            if (isCyclicUtil(i, visited, recStack)) {
                return true;
            }
        }
        return false;
    }
};

// Weighted Graph for shortest path algorithms
class WeightedGraph {
private:
    int V;
    std::vector<std::vector<std::pair<int, int>>> adj; // pair<vertex, weight>
    
public:
    WeightedGraph(int vertices) : V(vertices) {
        adj.resize(V);
    }
    
    void addEdge(int u, int v, int weight) {
        adj[u].push_back({v, weight});
    }
    
    // Dijkstra's shortest path algorithm
    std::vector<int> dijkstra(int src) {
        std::vector<int> dist(V, std::numeric_limits<int>::max());
        std::priority_queue<std::pair<int, int>, 
                          std::vector<std::pair<int, int>>,
                          std::greater<std::pair<int, int>>> pq;
        
        dist[src] = 0;
        pq.push({0, src});
        
        while (!pq.empty()) {
            int u = pq.top().second;
            pq.pop();
            
            for (auto& edge : adj[u]) {
                int v = edge.first;
                int weight = edge.second;
                
                if (dist[u] + weight < dist[v]) {
                    dist[v] = dist[u] + weight;
                    pq.push({dist[v], v});
                }
            }
        }
        
        return dist;
    }
    
    // Bellman-Ford algorithm (handles negative weights)
    std::vector<int> bellmanFord(int src) {
        std::vector<int> dist(V, std::numeric_limits<int>::max());
        dist[src] = 0;
        
        // Relax edges V-1 times
        for (int i = 1; i <= V - 1; i++) {
            for (int u = 0; u < V; u++) {
                for (auto& edge : adj[u]) {
                    int v = edge.first;
                    int weight = edge.second;
                    
                    if (dist[u] != std::numeric_limits<int>::max() && 
                        dist[u] + weight < dist[v]) {
                        dist[v] = dist[u] + weight;
                    }
                }
            }
        }
        
        // Check for negative cycles
        for (int u = 0; u < V; u++) {
            for (auto& edge : adj[u]) {
                int v = edge.first;
                int weight = edge.second;
                
                if (dist[u] != std::numeric_limits<int>::max() && 
                    dist[u] + weight < dist[v]) {
                    std::cout << "Graph contains negative weight cycle" << std::endl;
                    return {};
                }
            }
        }
        
        return dist;
    }
};

} // namespace graph
