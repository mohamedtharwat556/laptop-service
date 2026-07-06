/**
 * YAS Laptop Service Center - Language Manager
 * Handles multi-language support (English/Arabic)
 */

class LanguageManager {
    constructor() {
        this.currentLang = localStorage.getItem('YAS_language') || 'en';
        this.translations = {
            en: {
                // Navigation
                home: 'Home',
                services: 'Services',
                whyChooseUs: 'Why Choose Us',
                contact: 'Contact',
                submitRequest: 'Submit Request',
                shop: 'Shop',
                trackRequest: 'Track Request',
                
                // Hero
                heroTitle: 'Professional Laptop Repair & Services',
                heroSubtitle: 'Expert technicians, fast turnaround, and quality parts. We bring your laptop back to life.',
                submitRepair: 'Submit Repair Request',
                browseProducts: 'Browse Products',
                
                // Services
                ourServices: 'Our Services',
                hardwareRepair: 'Hardware Repair',
                hardwareRepairDesc: 'Screen replacement, keyboard repair, motherboard fixes, and component-level repairs.',
                softwareSolutions: 'Software Solutions',
                softwareSolutionsDesc: 'OS installation, virus removal, data recovery, and software optimization.',
                upgrades: 'Upgrades',
                upgradesDesc: 'RAM upgrades, SSD installation, battery replacement, and performance boosting.',
                maintenance: 'Maintenance',
                maintenanceDesc: 'Cleaning, thermal paste replacement, fan maintenance, and preventive care.',
                networkSetup: 'Network Setup',
                networkSetupDesc: 'WiFi configuration; network troubleshooting, and connectivity solutions.',
                consultation: 'Consultation',
                consultationDesc: 'Expert advice on laptop purchases, upgrades, and best practices.',
                
                // Why Choose Us
                whyChooseUsTitle: 'Why Choose Us',
                fastTurnaround: 'Fast Turnaround',
                fastTurnaroundDesc: 'Most repairs completed within 24-48 hours with express service available.',
                certifiedTechnicians: 'Certified Technicians',
                certifiedTechniciansDesc: 'Our team consists of certified professionals with years of experience.',
                affordablePricing: 'Affordable Pricing',
                affordablePricingDesc: 'Competitive rates with no hidden fees. Free quotes on all services.',
                qualityParts: 'Quality Parts',
                qualityPartsDesc: 'We use only genuine and high-quality replacement parts.',
                warranty: 'Warranty',
                warrantyDesc: '90-day warranty on all repairs and parts for your peace of mind.',
                convenientLocation: 'Convenient Location',
                convenientLocationDesc: 'Easily accessible location with drop-off and pickup services.',
                
                // Contact
                contactUs: 'Contact Us',
                phone: 'Phone',
                email: 'Email',
                address: 'Address',
                hours: 'Hours',
                
                // Forms
                fullName: 'Full Name',
                phoneNumber: 'Phone Number',
                laptopBrand: 'Laptop Brand',
                laptopModel: 'Laptop Model',
                deviceType: 'Device Type',
                problemDescription: 'Problem Description',
                priority: 'Priority',
                deviceImage: 'Device Image (Optional)',
                submit: 'Submit',
                
                // Status
                received: 'Received',
                waitingInspection: 'Waiting Inspection',
                underMaintenance: 'Under Maintenance',
                waitingParts: 'Waiting Parts',
                ready: 'Ready',
                delivered: 'Delivered',
                
                // Priority
                low: 'Low',
                medium: 'Medium',
                high: 'High',
                urgent: 'Urgent',
                
                // Shop
                products: 'Products',
                addToCart: 'Add to Cart',
                outOfStock: 'Out of Stock',
                inStock: 'in stock',
                price: 'Price',
                description: 'Description',
                
                // Cart
                shoppingCart: 'Shopping Cart',
                checkout: 'Checkout',
                orderSummary: 'Order Summary',
                subtotal: 'Subtotal',
                shipping: 'Shipping',
                tax: 'Tax',
                total: 'Total',
                placeOrder: 'Place Order',
                emptyCart: 'Your cart is empty',
                emptyCartDesc: 'Add some products to get started!',
                
                // Tracking
                trackYourRequest: 'Track Your Request',
                searchBy: 'Search By',
                phoneNumber: 'Phone Number',
                requestNumber: 'Request Number',
                track: 'Track Request',
                requestNotFound: 'Request Not Found',
                requestNotFoundDesc: 'No request found with the provided information.',
                tryAgain: 'Try Again',
                currentStatus: 'Current Status',
                statusTimeline: 'Status Timeline',
                technicianNotes: 'Technician Notes',
                estimatedCompletion: 'Estimated Completion',
                estimatedCost: 'Estimated Cost',
                
                // Dashboard
                dashboard: 'Dashboard',
                requests: 'Requests',
                orders: 'Orders',
                products: 'Products',
                users: 'Users',
                totalRequests: 'Total Requests',
                openRequests: 'Open Requests',
                completed: 'Completed',
                todayOrders: "Today's Orders",
                totalRevenue: 'Total Revenue',
                totalUsers: 'Total Users',
                pendingRequests: 'Pending Requests',
                totalAssigned: 'Total Assigned',
                
                // Login
                login: 'Login',
                username: 'Username',
                password: 'Password',
                logout: 'Logout',
                welcome: 'Welcome',
                invalidCredentials: 'Invalid credentials',
                loginSuccessful: 'Login successful!',
                
                // Admin
                adminPanel: 'Admin Panel',
                requestStatusDistribution: 'Request Status Distribution',
                revenueLast7Days: 'Revenue (Last 7 Days)',
                productsByCategory: 'Products by Category',
                userManagement: 'User Management',
                productManagement: 'Product Management',
                addUser: 'Add User',
                editUser: 'Edit User',
                deleteUser: 'Delete User',
                addProduct: 'Add Product',
                editProduct: 'Edit Product',
                deleteProduct: 'Delete Product',
                
                // Common
                save: 'Save',
                cancel: 'Cancel',
                confirm: 'Confirm',
                delete: 'Delete',
                edit: 'Edit',
                view: 'View',
                back: 'Back',
                search: 'Search',
                filter: 'Filter',
                all: 'All',
                yes: 'Yes',
                no: 'No',
                loading: 'Loading...',
                success: 'Success',
                error: 'Error',
                warning: 'Warning',
                info: 'Info'
            },
            ar: {
                // Navigation
                home: 'الرئيسية',
                services: 'الخدمات',
                whyChooseUs: 'لماذا نحن',
                contact: 'اتصل بنا',
                submitRequest: 'تقديم طلب',
                shop: 'المتجر',
                trackRequest: 'تتبع الطلب',
                
                // Hero
                heroTitle: 'خدمات إصلاح اللابتوب الاحترافية',
                heroSubtitle: 'فنيون خبراء، سرعة في الإنجاز، وقطع عالية الجودة. نعيد حياة لابتوبك.',
                submitRepair: 'تقديم طلب إصلاح',
                browseProducts: 'تصفح المنتجات',
                
                // Services
                ourServices: 'خدماتنا',
                hardwareRepair: 'إصلاح الأجهزة',
                hardwareRepairDesc: 'استبدال الشاشة، إصلاح لوحة المفاتيح، إصلاح اللوحة الأم، وإصلاح على مستوى المكونات.',
                softwareSolutions: 'حلول البرمجيات',
                softwareSolutionsDesc: 'تثبيت نظام التشغيل، إزالة الفيروسات، استعادة البيانات، وتحسين البرمجيات.',
                upgrades: 'الترقيات',
                upgradesDesc: 'ترقية الذاكرة العشوائية، تثبيت SSD، استبدال البطارية، وتحسين الأداء.',
                maintenance: 'الصيانة',
                maintenanceDesc: 'التنظيف، استبدال المعجون الحراري، صيانة المروحة، والرعاية الوقائية.',
                networkSetup: 'إعداد الشبكة',
                networkSetupDesc: 'تكوين WiFi، استكشاف مشاكل الشبكة وحلول الاتصال.',
                consultation: 'الاستشارات',
                consultationDesc: 'نصائح خبراء في شراء اللابتوب، الترقيات، وأفضل الممارسات.',
                
                // Why Choose Us
                whyChooseUsTitle: 'لماذا تختارنا',
                fastTurnaround: 'سرعة الإنجاز',
                fastTurnaroundDesc: 'معظم الإصلاحات تكتمل خلال 24-48 ساعة مع خدمة التوصيل السريع المتاحة.',
                certifiedTechnicians: 'فنيون معتمدون',
                certifiedTechniciansDesc: 'يتكون فريقنا من محترفين معتمدين بخبرة سنوات.',
                affordablePricing: 'أسعار معقولة',
                affordablePricingDesc: 'أسعار تنافسية بدون رسوم خفية. عروض مجانية على جميع الخدمات.',
                qualityParts: 'قطع عالية الجودة',
                qualityPartsDesc: 'نستخدم فقط قطع أصلية وعالية الجودة للاستبدال.',
                warranty: 'الضمان',
                warrantyDesc: 'ضمان 90 يوم على جميع الإصلاحات والقطع لراحتك.',
                convenientLocation: 'موقع مريح',
                convenientLocationDesc: 'موقع سهل الوصول مع خدمات التسليم والاستلام.',
                
                // Contact
                contactUs: 'اتصل بنا',
                phone: 'الهاتف',
                email: 'البريد الإلكتروني',
                address: 'العنوان',
                hours: 'ساعات العمل',
                
                // Forms
                fullName: 'الاسم الكامل',
                phoneNumber: 'رقم الهاتف',
                laptopBrand: 'ماركة اللابتوب',
                laptopModel: 'موديل اللابتوب',
                deviceType: 'نوع الجهاز',
                problemDescription: 'وصف المشكلة',
                priority: 'الأولوية',
                deviceImage: 'صورة الجهاز (اختياري)',
                submit: 'إرسال',
                
                // Status
                received: 'تم الاستلام',
                waitingInspection: 'بانتظار الفحص',
                underMaintenance: 'تحت الصيانة',
                waitingParts: 'بانتظار القطع',
                ready: 'جاهز',
                delivered: 'تم التسليم',
                
                // Priority
                low: 'منخفضة',
                medium: 'متوسطة',
                high: 'عالية',
                urgent: 'عاجلة',
                
                // Shop
                products: 'المنتجات',
                addToCart: 'أضف للسلة',
                outOfStock: 'نفدت الكمية',
                inStock: 'متوفر',
                price: 'السعر',
                description: 'الوصف',
                
                // Cart
                shoppingCart: 'سلة التسوق',
                checkout: 'إتمام الشراء',
                orderSummary: 'ملخص الطلب',
                subtotal: 'المجموع الفرعي',
                shipping: 'الشحن',
                tax: 'الضريبة',
                total: 'الإجمالي',
                placeOrder: 'تأكيد الطلب',
                emptyCart: 'سلة التسوق فارغة',
                emptyCartDesc: 'أضف بعض المنتجات للبدء!',
                
                // Tracking
                trackYourRequest: 'تتبع طلبك',
                searchBy: 'البحث بواسطة',
                phoneNumber: 'رقم الهاتف',
                requestNumber: 'رقم الطلب',
                track: 'تتبع الطلب',
                requestNotFound: 'الطلب غير موجود',
                requestNotFoundDesc: 'لم يتم العثور على طلب بالمعلومات المقدمة.',
                tryAgain: 'حاول مرة أخرى',
                currentStatus: 'الحالة الحالية',
                statusTimeline: 'جدول الحالة',
                technicianNotes: 'ملاحظات الفني',
                estimatedCompletion: 'تاريخ الانتهاء المقدر',
                estimatedCost: 'التكلفة المقدرة',
                
                // Dashboard
                dashboard: 'لوحة التحكم',
                requests: 'الطلبات',
                orders: 'الطلبات الشرائية',
                products: 'المنتجات',
                users: 'المستخدمون',
                totalRequests: 'إجمالي الطلبات',
                openRequests: 'الطلبات المفتوحة',
                completed: 'مكتمل',
                todayOrders: 'طلبات اليوم',
                totalRevenue: 'إجمالي الإيرادات',
                totalUsers: 'إجمالي المستخدمين',
                pendingRequests: 'الطلبات المعلقة',
                totalAssigned: 'إجمالي المعينين',
                
                // Login
                login: 'تسجيل الدخول',
                username: 'اسم المستخدم',
                password: 'كلمة المرور',
                logout: 'تسجيل الخروج',
                welcome: 'مرحباً',
                invalidCredentials: 'بيانات الدخول غير صحيحة',
                loginSuccessful: 'تم تسجيل الدخول بنجاح!',
                
                // Admin
                adminPanel: 'لوحة الإدارة',
                requestStatusDistribution: 'توزيع حالة الطلبات',
                revenueLast7Days: 'الإيرادات (آخر 7 أيام)',
                productsByCategory: 'المنتجات حسب الفئة',
                userManagement: 'إدارة المستخدمين',
                productManagement: 'إدارة المنتجات',
                addUser: 'إضافة مستخدم',
                editUser: 'تعديل مستخدم',
                deleteUser: 'حذف مستخدم',
                addProduct: 'إضافة منتج',
                editProduct: 'تعديل منتج',
                deleteProduct: 'حذف منتج',
                
                // Common
                save: 'حفظ',
                cancel: 'إلغاء',
                confirm: 'تأكيد',
                delete: 'حذف',
                edit: 'تعديل',
                view: 'عرض',
                back: 'رجوع',
                search: 'بحث',
                filter: 'تصفية',
                all: 'الكل',
                yes: 'نعم',
                no: 'لا',
                loading: 'جاري التحميل...',
                success: 'نجح',
                error: 'خطأ',
                warning: 'تحذير',
                info: 'معلومات'
            }
        };
        
        this.init();
    }

    init() {
        this.applyLanguage();
        this.createLanguageToggle();
    }

    createLanguageToggle() {
        const toggle = document.createElement('button');
        toggle.className = 'language-toggle';
        toggle.style.cssText = `
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            cursor: pointer;
            margin-left: 1rem;
            font-size: 0.875rem;
            transition: all 0.3s ease;
        `;
        toggle.innerHTML = this.currentLang === 'en' ? '🇺🇸 EN' : '🇸🇦 عربي';
        toggle.onclick = () => this.toggleLanguage();
        
        const navbar = document.querySelector('.nav-container');
        if (navbar) {
            navbar.appendChild(toggle);
        }
    }

    toggleLanguage() {
        this.currentLang = this.currentLang === 'en' ? 'ar' : 'en';
        localStorage.setItem('YAS_language', this.currentLang);
        this.applyLanguage();
        this.updateToggleIcon();
        location.reload();
    }

    applyLanguage() {
        document.documentElement.lang = this.currentLang;
        document.documentElement.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';
        
        // Load RTL CSS if Arabic
        if (this.currentLang === 'ar') {
            const rtlLink = document.createElement('link');
            rtlLink.rel = 'stylesheet';
            rtlLink.href = 'css/rtl.css';
            rtlLink.id = 'rtl-stylesheet';
            if (!document.getElementById('rtl-stylesheet')) {
                document.head.appendChild(rtlLink);
            }
        } else {
            const rtlLink = document.getElementById('rtl-stylesheet');
            if (rtlLink) {
                rtlLink.remove();
            }
        }
    }

    updateToggleIcon() {
        const toggle = document.querySelector('.language-toggle');
        if (toggle) {
            toggle.innerHTML = this.currentLang === 'en' ? '🇺🇸 EN' : '🇸🇦 عربي';
        }
    }

    t(key) {
        return this.translations[this.currentLang][key] || key;
    }

    translatePage() {
        // Translate elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = this.t(key);
        });

        // Translate placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = this.t(key);
        });

        // Translate titles
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            el.title = this.t(key);
        });
    }
}

// Create global instance
const languageManager = new LanguageManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    languageManager.translatePage();
});
