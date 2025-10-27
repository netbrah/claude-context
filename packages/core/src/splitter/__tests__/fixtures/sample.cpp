// Sample C++ file for testing
#include <iostream>
#include <string>
#include <vector>

// Simple function
int add(int a, int b) {
    return a + b;
}

// Function with more logic
int factorial(int n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}

// Class definition
class Calculator {
private:
    std::string name;
    
public:
    Calculator(std::string n) : name(n) {}
    
    int multiply(int a, int b) {
        return a * b;
    }
    
    double divide(double a, double b) {
        if (b == 0) {
            throw std::runtime_error("Division by zero");
        }
        return a / b;
    }
    
    std::string getName() const {
        return name;
    }
};

// Namespace
namespace MathUtils {
    const double PI = 3.14159;
    
    double calculateCircleArea(double radius) {
        return PI * radius * radius;
    }
    
    double calculateCircleCircumference(double radius) {
        return 2 * PI * radius;
    }
}

// Template function
template<typename T>
T maximum(T a, T b) {
    return (a > b) ? a : b;
}

// Main function
int main() {
    std::cout << "Testing C++ parser" << std::endl;
    
    int sum = add(5, 3);
    std::cout << "Sum: " << sum << std::endl;
    
    Calculator calc("MyCalculator");
    int product = calc.multiply(4, 5);
    std::cout << "Product: " << product << std::endl;
    
    double area = MathUtils::calculateCircleArea(5.0);
    std::cout << "Circle area: " << area << std::endl;
    
    return 0;
}
