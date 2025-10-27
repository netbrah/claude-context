// Advanced data structures implementation
#include <iostream>
#include <vector>
#include <memory>
#include <stdexcept>
#include <algorithm>

namespace datastructures {

// Binary Search Tree
template<typename T>
class BinarySearchTree {
private:
    struct Node {
        T data;
        std::unique_ptr<Node> left;
        std::unique_ptr<Node> right;
        
        Node(const T& value) : data(value), left(nullptr), right(nullptr) {}
    };
    
    std::unique_ptr<Node> root;
    
    void insertHelper(std::unique_ptr<Node>& node, const T& value) {
        if (!node) {
            node = std::make_unique<Node>(value);
            return;
        }
        
        if (value < node->data) {
            insertHelper(node->left, value);
        } else if (value > node->data) {
            insertHelper(node->right, value);
        }
    }
    
    bool searchHelper(const Node* node, const T& value) const {
        if (!node) return false;
        if (node->data == value) return true;
        
        if (value < node->data) {
            return searchHelper(node->left.get(), value);
        } else {
            return searchHelper(node->right.get(), value);
        }
    }
    
    void inorderHelper(const Node* node, std::vector<T>& result) const {
        if (!node) return;
        inorderHelper(node->left.get(), result);
        result.push_back(node->data);
        inorderHelper(node->right.get(), result);
    }
    
public:
    BinarySearchTree() : root(nullptr) {}
    
    void insert(const T& value) {
        insertHelper(root, value);
    }
    
    bool search(const T& value) const {
        return searchHelper(root.get(), value);
    }
    
    std::vector<T> inorderTraversal() const {
        std::vector<T> result;
        inorderHelper(root.get(), result);
        return result;
    }
};

// AVL Tree (Self-balancing BST)
template<typename T>
class AVLTree {
private:
    struct Node {
        T data;
        int height;
        std::unique_ptr<Node> left;
        std::unique_ptr<Node> right;
        
        Node(const T& value) : data(value), height(1), left(nullptr), right(nullptr) {}
    };
    
    std::unique_ptr<Node> root;
    
    int height(const Node* node) const {
        return node ? node->height : 0;
    }
    
    int getBalance(const Node* node) const {
        return node ? height(node->left.get()) - height(node->right.get()) : 0;
    }
    
    void updateHeight(Node* node) {
        if (node) {
            node->height = 1 + std::max(height(node->left.get()), height(node->right.get()));
        }
    }
    
    std::unique_ptr<Node> rotateRight(std::unique_ptr<Node> y) {
        auto x = std::move(y->left);
        y->left = std::move(x->right);
        updateHeight(y.get());
        x->right = std::move(y);
        updateHeight(x.get());
        return x;
    }
    
    std::unique_ptr<Node> rotateLeft(std::unique_ptr<Node> x) {
        auto y = std::move(x->right);
        x->right = std::move(y->left);
        updateHeight(x.get());
        y->left = std::move(x);
        updateHeight(y.get());
        return y;
    }
    
    std::unique_ptr<Node> insertHelper(std::unique_ptr<Node> node, const T& value) {
        if (!node) {
            return std::make_unique<Node>(value);
        }
        
        if (value < node->data) {
            node->left = insertHelper(std::move(node->left), value);
        } else if (value > node->data) {
            node->right = insertHelper(std::move(node->right), value);
        } else {
            return node; // Duplicate values not allowed
        }
        
        updateHeight(node.get());
        int balance = getBalance(node.get());
        
        // Left-Left case
        if (balance > 1 && value < node->left->data) {
            return rotateRight(std::move(node));
        }
        
        // Right-Right case
        if (balance < -1 && value > node->right->data) {
            return rotateLeft(std::move(node));
        }
        
        // Left-Right case
        if (balance > 1 && value > node->left->data) {
            node->left = rotateLeft(std::move(node->left));
            return rotateRight(std::move(node));
        }
        
        // Right-Left case
        if (balance < -1 && value < node->right->data) {
            node->right = rotateRight(std::move(node->right));
            return rotateLeft(std::move(node));
        }
        
        return node;
    }
    
public:
    AVLTree() : root(nullptr) {}
    
    void insert(const T& value) {
        root = insertHelper(std::move(root), value);
    }
};

// Trie (Prefix Tree)
class Trie {
private:
    struct TrieNode {
        std::array<std::unique_ptr<TrieNode>, 26> children;
        bool isEndOfWord;
        
        TrieNode() : isEndOfWord(false) {
            children.fill(nullptr);
        }
    };
    
    std::unique_ptr<TrieNode> root;
    
public:
    Trie() : root(std::make_unique<TrieNode>()) {}
    
    void insert(const std::string& word) {
        TrieNode* current = root.get();
        
        for (char c : word) {
            int index = c - 'a';
            if (!current->children[index]) {
                current->children[index] = std::make_unique<TrieNode>();
            }
            current = current->children[index].get();
        }
        
        current->isEndOfWord = true;
    }
    
    bool search(const std::string& word) const {
        const TrieNode* current = root.get();
        
        for (char c : word) {
            int index = c - 'a';
            if (!current->children[index]) {
                return false;
            }
            current = current->children[index].get();
        }
        
        return current->isEndOfWord;
    }
    
    bool startsWith(const std::string& prefix) const {
        const TrieNode* current = root.get();
        
        for (char c : prefix) {
            int index = c - 'a';
            if (!current->children[index]) {
                return false;
            }
            current = current->children[index].get();
        }
        
        return true;
    }
};

// Segment Tree (for range queries)
class SegmentTree {
private:
    std::vector<int> tree;
    int n;
    
    void buildTree(const std::vector<int>& arr, int node, int start, int end) {
        if (start == end) {
            tree[node] = arr[start];
        } else {
            int mid = (start + end) / 2;
            buildTree(arr, 2 * node, start, mid);
            buildTree(arr, 2 * node + 1, mid + 1, end);
            tree[node] = tree[2 * node] + tree[2 * node + 1];
        }
    }
    
    int queryHelper(int node, int start, int end, int left, int right) const {
        if (right < start || end < left) {
            return 0;
        }
        
        if (left <= start && end <= right) {
            return tree[node];
        }
        
        int mid = (start + end) / 2;
        int leftSum = queryHelper(2 * node, start, mid, left, right);
        int rightSum = queryHelper(2 * node + 1, mid + 1, end, left, right);
        return leftSum + rightSum;
    }
    
    void updateHelper(int node, int start, int end, int idx, int value) {
        if (start == end) {
            tree[node] = value;
        } else {
            int mid = (start + end) / 2;
            if (idx <= mid) {
                updateHelper(2 * node, start, mid, idx, value);
            } else {
                updateHelper(2 * node + 1, mid + 1, end, idx, value);
            }
            tree[node] = tree[2 * node] + tree[2 * node + 1];
        }
    }
    
public:
    SegmentTree(const std::vector<int>& arr) {
        n = arr.size();
        tree.resize(4 * n);
        buildTree(arr, 1, 0, n - 1);
    }
    
    int query(int left, int right) const {
        return queryHelper(1, 0, n - 1, left, right);
    }
    
    void update(int idx, int value) {
        updateHelper(1, 0, n - 1, idx, value);
    }
};

// Disjoint Set Union (Union-Find)
class DisjointSet {
private:
    std::vector<int> parent;
    std::vector<int> rank;
    
public:
    DisjointSet(int n) : parent(n), rank(n, 0) {
        for (int i = 0; i < n; i++) {
            parent[i] = i;
        }
    }
    
    int find(int x) {
        if (parent[x] != x) {
            parent[x] = find(parent[x]); // Path compression
        }
        return parent[x];
    }
    
    void unite(int x, int y) {
        int rootX = find(x);
        int rootY = find(y);
        
        if (rootX != rootY) {
            if (rank[rootX] < rank[rootY]) {
                parent[rootX] = rootY;
            } else if (rank[rootX] > rank[rootY]) {
                parent[rootY] = rootX;
            } else {
                parent[rootY] = rootX;
                rank[rootX]++;
            }
        }
    }
    
    bool connected(int x, int y) {
        return find(x) == find(y);
    }
};

} // namespace datastructures
