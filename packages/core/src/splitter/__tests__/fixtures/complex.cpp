// Complex C++ file with various constructs
#include <iostream>
#include <vector>
#include <memory>
#include <algorithm>

// Forward declaration
class Node;

// Struct definition
struct Point {
    double x;
    double y;
    
    Point(double x_val, double y_val) : x(x_val), y(y_val) {}
};

// Class with inheritance
class Shape {
protected:
    std::string color;
    
public:
    virtual ~Shape() = default;
    virtual double area() const = 0;
    virtual void draw() const = 0;
    
    void setColor(const std::string& c) {
        color = c;
    }
};

class Rectangle : public Shape {
private:
    double width;
    double height;
    
public:
    Rectangle(double w, double h) : width(w), height(h) {}
    
    double area() const override {
        return width * height;
    }
    
    void draw() const override {
        std::cout << "Drawing rectangle" << std::endl;
    }
};

class Circle : public Shape {
private:
    double radius;
    
public:
    Circle(double r) : radius(r) {}
    
    double area() const override {
        return 3.14159 * radius * radius;
    }
    
    void draw() const override {
        std::cout << "Drawing circle" << std::endl;
    }
};

// Template class
template<typename T>
class Container {
private:
    std::vector<T> items;
    
public:
    void add(const T& item) {
        items.push_back(item);
    }
    
    T get(size_t index) const {
        return items[index];
    }
    
    size_t size() const {
        return items.size();
    }
    
    void forEach(std::function<void(const T&)> func) const {
        for (const auto& item : items) {
            func(item);
        }
    }
};

// Namespace with nested namespace
namespace Graphics {
    namespace Utils {
        void printInfo(const std::string& message) {
            std::cout << "[INFO] " << message << std::endl;
        }
        
        void printError(const std::string& message) {
            std::cerr << "[ERROR] " << message << std::endl;
        }
    }
    
    class Renderer {
    public:
        void render(const std::vector<std::shared_ptr<Shape>>& shapes) {
            for (const auto& shape : shapes) {
                shape->draw();
            }
        }
    };
}

// Function with complex logic
std::vector<int> findPrimes(int n) {
    std::vector<int> primes;
    for (int i = 2; i <= n; i++) {
        bool isPrime = true;
        for (int j = 2; j * j <= i; j++) {
            if (i % j == 0) {
                isPrime = false;
                break;
            }
        }
        if (isPrime) {
            primes.push_back(i);
        }
    }
    return primes;
}

// Lambda and modern C++ features
void demonstrateModernCpp() {
    auto lambda = [](int x, int y) -> int {
        return x + y;
    };
    
    std::vector<int> numbers = {1, 2, 3, 4, 5};
    std::for_each(numbers.begin(), numbers.end(), [](int n) {
        std::cout << n << " ";
    });
    std::cout << std::endl;
}
