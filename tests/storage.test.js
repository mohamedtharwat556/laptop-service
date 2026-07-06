// Storage Utility Tests
describe('Storage Utility Tests', () => {
    // Mock localStorage
    const mockLocalStorage = {
        store: {},
        getItem: function(key) {
            return this.store[key] || null;
        },
        setItem: function(key, value) {
            this.store[key] = String(value);
        },
        removeItem: function(key) {
            delete this.store[key];
        },
        clear: function() {
            this.store = {};
        }
    };

    beforeAll(() => {
        global.localStorage = mockLocalStorage;
    });

    beforeEach(() => {
        mockLocalStorage.clear();
    });

    test('should store and retrieve data', () => {
        const testData = { name: 'Test', value: 123 };
        localStorage.setItem('testKey', JSON.stringify(testData));
        const retrieved = JSON.parse(localStorage.getItem('testKey'));
        expect(retrieved).toEqual(testData);
    });

    test('should return null for non-existent key', () => {
        const result = localStorage.getItem('nonExistentKey');
        expect(result).toBeNull();
    });

    test('should remove item', () => {
        localStorage.setItem('testKey', 'testValue');
        localStorage.removeItem('testKey');
        const result = localStorage.getItem('testKey');
        expect(result).toBeNull();
    });

    test('should clear all items', () => {
        localStorage.setItem('key1', 'value1');
        localStorage.setItem('key2', 'value2');
        localStorage.clear();
        expect(localStorage.getItem('key1')).toBeNull();
        expect(localStorage.getItem('key2')).toBeNull();
    });
});
