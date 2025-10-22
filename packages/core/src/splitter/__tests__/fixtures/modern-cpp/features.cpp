// Modern C++ features (C++11/14/17/20)
#include <iostream>
#include <memory>
#include <vector>
#include <string>
#include <optional>
#include <variant>
#include <tuple>
#include <functional>
#include <algorithm>
#include <ranges>
#include <concepts>
#include <coroutine>

namespace modern_cpp {

// Smart Pointers (C++11)
class SmartPointerDemo {
public:
    void demonstrateUnique() {
        auto ptr = std::make_unique<int>(42);
        std::cout << "Unique ptr value: " << *ptr << std::endl;
    }
    
    void demonstrateShared() {
        auto ptr1 = std::make_shared<std::string>("Hello");
        auto ptr2 = ptr1;
        std::cout << "Shared ptr count: " << ptr1.use_count() << std::endl;
    }
    
    std::shared_ptr<int> createShared(int value) {
        return std::make_shared<int>(value);
    }
};

// Lambda Expressions (C++11/14)
class LambdaExamples {
public:
    void basicLambda() {
        auto add = [](int a, int b) { return a + b; };
        std::cout << "Sum: " << add(5, 3) << std::endl;
    }
    
    void captureByValue() {
        int x = 10;
        auto addX = [x](int y) { return x + y; };
        std::cout << "Result: " << addX(5) << std::endl;
    }
    
    void captureByReference() {
        int counter = 0;
        auto increment = [&counter]() { counter++; };
        increment();
        increment();
        std::cout << "Counter: " << counter << std::endl;
    }
    
    // Generic lambda (C++14)
    void genericLambda() {
        auto print = [](const auto& x) {
            std::cout << x << std::endl;
        };
        print(42);
        print("Hello");
        print(3.14);
    }
};

// Move Semantics (C++11)
class MoveSemantics {
private:
    std::unique_ptr<int[]> data;
    size_t size;
    
public:
    // Constructor
    MoveSemantics(size_t s) : data(std::make_unique<int[]>(s)), size(s) {}
    
    // Move constructor
    MoveSemantics(MoveSemantics&& other) noexcept 
        : data(std::move(other.data)), size(other.size) {
        other.size = 0;
    }
    
    // Move assignment operator
    MoveSemantics& operator=(MoveSemantics&& other) noexcept {
        if (this != &other) {
            data = std::move(other.data);
            size = other.size;
            other.size = 0;
        }
        return *this;
    }
    
    // Delete copy operations
    MoveSemantics(const MoveSemantics&) = delete;
    MoveSemantics& operator=(const MoveSemantics&) = delete;
};

// Variadic Templates (C++11)
template<typename... Args>
void print(Args... args) {
    ((std::cout << args << " "), ...) << std::endl; // C++17 fold expression
}

template<typename T>
T sum(T value) {
    return value;
}

template<typename T, typename... Args>
T sum(T first, Args... args) {
    return first + sum(args...);
}

// std::optional (C++17)
class OptionalExample {
public:
    std::optional<int> findValue(const std::vector<int>& vec, int target) {
        auto it = std::find(vec.begin(), vec.end(), target);
        if (it != vec.end()) {
            return *it;
        }
        return std::nullopt;
    }
    
    void useOptional() {
        std::vector<int> numbers = {1, 2, 3, 4, 5};
        auto result = findValue(numbers, 3);
        
        if (result.has_value()) {
            std::cout << "Found: " << result.value() << std::endl;
        } else {
            std::cout << "Not found" << std::endl;
        }
    }
};

// std::variant (C++17)
using Value = std::variant<int, double, std::string>;

class VariantExample {
public:
    void processValue(const Value& v) {
        std::visit([](const auto& val) {
            std::cout << "Value: " << val << std::endl;
        }, v);
    }
    
    Value createValue(int type) {
        switch (type) {
            case 0: return 42;
            case 1: return 3.14;
            case 2: return std::string("Hello");
            default: return 0;
        }
    }
};

// Structured Bindings (C++17)
class StructuredBindings {
public:
    std::tuple<int, std::string, double> getData() {
        return {42, "Hello", 3.14};
    }
    
    void useStructuredBinding() {
        auto [num, str, pi] = getData();
        std::cout << num << ", " << str << ", " << pi << std::endl;
        
        std::map<std::string, int> map = {{"one", 1}, {"two", 2}};
        for (const auto& [key, value] : map) {
            std::cout << key << ": " << value << std::endl;
        }
    }
};

// Concepts (C++20)
template<typename T>
concept Numeric = std::is_arithmetic_v<T>;

template<Numeric T>
T multiply(T a, T b) {
    return a * b;
}

template<typename T>
concept Addable = requires(T a, T b) {
    { a + b } -> std::convertible_to<T>;
};

template<Addable T>
T add(T a, T b) {
    return a + b;
}

// Ranges (C++20)
class RangesExample {
public:
    void demonstrateRanges() {
        std::vector<int> numbers = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
        
        // Filter even numbers and square them
        auto result = numbers 
            | std::views::filter([](int n) { return n % 2 == 0; })
            | std::views::transform([](int n) { return n * n; });
        
        for (int n : result) {
            std::cout << n << " ";
        }
        std::cout << std::endl;
    }
};

// Constexpr (C++11/14/17/20)
class ConstexprExamples {
public:
    static constexpr int factorial(int n) {
        return n <= 1 ? 1 : n * factorial(n - 1);
    }
    
    static constexpr int power(int base, int exp) {
        int result = 1;
        for (int i = 0; i < exp; ++i) {
            result *= base;
        }
        return result;
    }
    
    // constexpr if (C++17)
    template<typename T>
    static auto getValue(T t) {
        if constexpr (std::is_integral_v<T>) {
            return t + 1;
        } else if constexpr (std::is_floating_point_v<T>) {
            return t + 0.1;
        } else {
            return t;
        }
    }
};

// Perfect Forwarding (C++11)
template<typename T>
class Wrapper {
private:
    T value;
    
public:
    template<typename U>
    Wrapper(U&& val) : value(std::forward<U>(val)) {}
    
    T& get() { return value; }
    const T& get() const { return value; }
};

// Type Traits (C++11)
template<typename T>
class TypeTraitsExample {
public:
    static void printInfo() {
        std::cout << "Is integer: " << std::is_integral_v<T> << std::endl;
        std::cout << "Is pointer: " << std::is_pointer_v<T> << std::endl;
        std::cout << "Is const: " << std::is_const_v<T> << std::endl;
        std::cout << "Size: " << sizeof(T) << std::endl;
    }
};

// Thread-safe Singleton (C++11)
class Singleton {
private:
    Singleton() = default;
    
public:
    Singleton(const Singleton&) = delete;
    Singleton& operator=(const Singleton&) = delete;
    
    static Singleton& getInstance() {
        static Singleton instance;
        return instance;
    }
    
    void doSomething() {
        std::cout << "Singleton instance" << std::endl;
    }
};

// SFINAE and enable_if (C++11)
template<typename T>
typename std::enable_if<std::is_integral<T>::value, T>::type
square(T value) {
    return value * value;
}

template<typename T>
typename std::enable_if<std::is_floating_point<T>::value, T>::type
square(T value) {
    return value * value;
}

// Class Template Argument Deduction (C++17)
template<typename T>
class Container {
private:
    T value;
    
public:
    Container(T val) : value(val) {}
    T getValue() const { return value; }
};

// User-defined literals (C++11)
namespace literals {
    constexpr long double operator"" _km(long double val) {
        return val * 1000.0;
    }
    
    constexpr long double operator"" _m(long double val) {
        return val;
    }
}

} // namespace modern_cpp
