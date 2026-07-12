/* =======================================================
   YAS Laptop Service — AI Advanced Premium Chatbot v2.0
   Interactive Diagnostic Wizard · Text-to-Speech · Audio Synth
   ======================================================= */

(function () {
    'use strict';

    // ===================================
    // WEB AUDIO API - CHIME SYNTHESIZER
    // ===================================
    const AudioSynth = {
        ctx: null,
        init() {
            if (!this.ctx) {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            }
        },
        playPop() {
            try {
                this.init();
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.1);
                
                gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
                
                osc.start();
                osc.stop(this.ctx.currentTime + 0.15);
            } catch(e){}
        },
        playNotification() {
            try {
                this.init();
                const now = this.ctx.currentTime;
                
                // Synth chime double beep
                [523.25, 659.25].forEach((freq, idx) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.08);
                    
                    gain.gain.setValueAtTime(0.12, now + idx * 0.08);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.15);
                    
                    osc.start(now + idx * 0.08);
                    osc.stop(now + idx * 0.08 + 0.15);
                });
            } catch(e){}
        },
        playKeypress() {
            try {
                this.init();
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, this.ctx.currentTime);
                
                gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);
                
                osc.start();
                osc.stop(this.ctx.currentTime + 0.03);
            } catch(e){}
        }
    };

    // ===================================
    // KNOWLEDGE BASE (Arabic maintenance)
    // ===================================
    const KB = [
        {
            patterns: ['مرحبا', 'هلا', 'اهلا', 'السلام', 'مساء', 'صباح', 'هاي', 'hi', 'hello'],
            replies: [
                'أهلاً وسهلاً بك في مركز YAS! 😊 أنا مساعدك الذكي. كيف أقدر أساعدك اليوم في صيانة لابتوبك؟\n\nيمكنك استخدام أزرار الرد السريع أو كتابة مشكلتك مباشرة.'
            ]
        },
        {
            patterns: ['سعر', 'اسعار', 'كلفة', 'تكلفة', 'بكام', 'بكم', 'كم', 'بياخد', 'الفلوس', 'فلوس', 'ثمن', 'تمن', 'حساب', 'تكاليف'],
            replies: [
                '💰 بمركز YAS، يتم فحص وتشخيص العطل مجاناً بالكامل!\n\nنظراً لأن تكلفة الصيانة تختلف حسب نوع العطل الدقيق وموديل اللابتوب وتكلفة قطع الغيار المطلوبة، فإننا نحدد السعر النهائي بدقة عند التواصل معنا.\n\n📞 للحصول على عرض سعر فوري ومجاني لجهازك:\n• تواصل معنا هاتفياً: **01013791517**\n• <a href="https://wa.me/201013791517" target="_blank" class="chat-link">💬 اضغط هنا للتسعير المباشر عبر واتساب</a>'
            ]
        },
        {
            patterns: ['وقت', 'كام يوم', 'متى', 'مدة', 'امتى', 'يجهز', 'انهاء'],
            replies: [
                '⏱️ سرعة تقديم الخدمة:\n\n• **الأعطال البسيطة والبرمجيات:** نفس اليوم (خلال ساعات معدودة).\n• **الصيانات العادية والترقيات:** 24 - 48 ساعة.\n• **توفير قطع الغيار النادرة:** 3 - 5 أيام كحد أقصى.\n\nنلتزم بإنهاء جهازك في أسرع وقت لراحتك!'
            ]
        },
        {
            patterns: ['طلب', 'اصلح', 'صيانة', 'بعت', 'ابعت', 'اقدم', 'تقديم', 'request'],
            replies: [
                '🔧 لتقديم طلب صيانة وحجز موعد، يرجى الضغط هنا:\n<a href="customer.html" class="chat-link">📋 نموذج تقديم طلب صيانة</a>\n\nأو تواصل معنا لتأكيد الحجز فوراً:\n📞 01013791517\n💬 <a href="https://wa.me/201013791517" target="_blank" class="chat-link">تواصل عبر واتساب</a>'
            ]
        },
        {
            patterns: ['تتبع', 'طلبي', 'track', 'وين', 'فين', 'حالة'],
            replies: [
                '🔍 لتتبع حالة جهازك وتطورات الصيانة خطوة بخطوة:\n<a href="track.html" class="chat-link">📍 صفحة تتبع الطلبات</a>\n\nستحتاج فقط لإدخال رقم الطلب أو رقم الهاتف المسجل لدينا.'
            ]
        },

        {
            patterns: ['هاتف', 'رقم', 'تليفون', 'واتساب', 'whatsapp', 'تواصل', 'اتصل'],
            replies: [
                '📞 نحن متواجدون لمساعدتك:\n\n• الاتصال بنا هاتفياً: **01013791517**\n• <a href="https://wa.me/201013791517" target="_blank" class="chat-link">💬 اضغط هنا للدردشة المباشرة عبر واتساب</a>'
            ]
        },
        {
            patterns: ['شاشة', 'screen', 'lcd', 'display', 'شاشه', 'المكسورة', 'كسر'],
            replies: [
                '🖥️ خدمات الشاشات بمركز YAS:\n\n• استبدال شاشات مكسورة أو تالفة بشاشات أصلية وجديدة.\n• حل مشاكل الخطوط، البكسلات الميتة، وتوهج الشاشة.\n• ضمان 90 يوم على الشاشات المستبدلة.\n\nيرجى إرسال موديل اللابتوب لتحديد السعر وتوافر الشاشة بدقة!'
            ]
        },
        {
            patterns: ['بطارية', 'battery', 'شحن', 'مش بتشحن', 'شاحن', 'سوكت'],
            replies: [
                '🔋 حلول الشحن والبطاريات:\n\n• استبدال البطاريات التالفة أو التي تفرغ بسرعة ببطاريات أصلية مكفولة.\n• إصلاح سوكت الشحن (DC Jack) إذا كان اللابتوب لا يشعر بالشاحن.\n• فحص واختبار أداء الشحن للتأكد من سلامة اللوحة الأم.\n\nنوفر ضماناً كاملاً على قطع الشحن.'
            ]
        },
        {
            patterns: ['رام', 'ram', 'هارد', 'hard', 'ssd', 'ترقية', 'upgrade', 'مساحة', 'توسيع'],
            replies: [
                '⚡ ترقية لابتوبك لسرعة خارقة:\n\n• **استبدال الهارد العادي بـ SSD (فائق السرعة):** يزيد سرعة إقلاع واستجابة الجهاز حتى 10 مرات!\n• **ترقية الرامات (RAM):** لتشغيل العديد من البرامج والألعاب الثقيلة دون بطء.\n\nتواصل معنا لننصحك بأفضل سعة وتوافق لقطع لابتوبك.'
            ]
        },
        {
            patterns: ['فيروس', 'virus', 'malware', 'بطيء', 'slow', 'اداء', 'برنامج', 'ويندوز', 'نسخة', 'windows', 'تهنيج'],
            replies: [
                '💻 صيانة السوفت وير والويندوز:\n\n• تثبيت وتفعيل نسخ Windows أصلية ومستقرة مع تعريف كافة القطع.\n• فحص شامل وتنظيف الفيروسات وملفات التجسس وإزالتها تماماً.\n• تحسين إعدادات النظام وتسريع إقلاع الجهاز.\n• استعادة البيانات المفقودة والمحذوفة.\n\nتتم الصيانة بأمان تام لبياناتك الشخصية.'
            ]
        },
        {
            patterns: ['حرارة', 'سخونة', 'مروحة', 'مراوح', 'صوت', 'عالي', 'تنظيف', 'معجون'],
            replies: [
                '🌡️ علاج السخونة وصوت المروحة العالي:\n\nالسخونة الزائدة تؤدي لتلف المعالج كلياً! نقوم بـ:\n• تفكيك اللابتوب وتنظيف المشتت والمروحة من الأتربة المتراكمة.\n• استبدال المعجون الحراري القديم بمعجون احترافي عالي الجودة لخفض الحرارة.\n• صيانة المروحة أو استبدالها في حال وجود كسر بشفراتها.\n\nتتم الصيانة خلال ساعة واحدة فقط بالمركز!'
            ]
        },
        {
            patterns: ['ماء', 'سائل', 'عصير', 'شاي', 'قهوة', 'مياه', 'مبلول', 'وقع عليه'],
            replies: [
                '🚨 **هام جداً في حالة انسكاب سائل على اللابتوب:**\n\n1. قم بإيقاف تشغيل اللابتوب فوراً بالضغط المطول على زر الطاقة.\n2. افصل الشاحن وأي أجهزة خارجية.\n3. اقلب اللابتوب على شكل حرف (V) مقلوب لمنع السائل من الوصول للوحة الأم.\n4. **لا تحاول تشغيل الجهاز نهائياً** حتى يتم فحصه وتجفيفه وتنظيفه من الأملاح بالمركز لتجنب حدوث التماس كهربائي يحرق اللوحة الأم!'
            ]
        },
        {
            patterns: ['شاشة زرقاء', 'الزرقاء', 'عطل', 'بلو سكرين', 'شاشه زرقاء', 'blue screen'],
            replies: [
                '🔵 الشاشة الزرقاء (Blue Screen of Death):\n\nتظهر عادةً نتيجة عطل في الهاردوير (مثل الرامات أو الهارد) أو مشكلة بالتعريفات والويندوز.\nقم بإحضار الجهاز لنقوم بفحصه مجاناً وتحديد العطل وإصلاحه بدقة.'
            ]
        },
        {
            patterns: ['ديل', 'dell', 'اتش بي', 'hp', 'لينوفو', 'lenovo', 'ماك', 'mac', 'macbook', 'ايسوس', 'asus', 'ايسر', 'acer', 'توشيبا', 'toshiba'],
            replies: [
                '🔧 مركز YAS يدعم صيانة جميع أنواع اللابتوب الاحترافية:\n\n• نوفر قطع غيار أصلية ومضمونة لشركات Dell و HP و Lenovo و Acer و Asus و Toshiba.\n• متخصصون في صيانة أجهزة Apple MacBook الدقيقة وإصلاح اللوحة الأم والـ logic board الخاص بها.'
            ]
        },
        {
            patterns: ['كم جهاز', 'صلحتوا', 'اجهزة', 'عدد الاجهزة', 'خبرة', 'انجزتوا'],
            replies: [
                '🚀 قمنا بإصلاح وصيانة أكثر من **1500+ جهاز لابتوب** بنجاح حتى الآن بمختلف الموديلات والأعطال!'
            ]
        },
        {
            patterns: ['رضا', 'تقييم', 'آراء', 'ثقة', 'راي الناس', 'مضمون'],
            replies: [
                '⭐ فخورون جداً بأن **نسبة رضا عملائنا هي 99%**! نسعى دائماً لتقديم الخدمة بأعلى جودة مع ضمان 90 يوم لراحة بالك.'
            ]
        },
        {
            patterns: ['سرعة', 'وقت الصيانة', 'ساعة', 'يوم', 'تستغرق', 'بتاخد وقت'],
            replies: [
                '⏱️ **متوسط سرعة الصيانة لدينا هو 24 ساعة فقط** للعديد من الأعطال البرمجية والصيانات السريعة لضمان عودة جهازك للعمل بأسرع وقت.'
            ]
        },
        {
            patterns: ['من انتم', 'مركز', 'yas', 'ياس', 'معلومات', 'احصائيات', 'ارقام'],
            replies: [
                '🏢 **مركز صيانة لابتوب YAS** هو شريكك الموثوق للصيانة الاحترافية:\n\n• 🚀 **1500+ أجهزة تم إصلاحها** بنجاح.\n• ⭐ **99% نسبة رضا العملاء**.\n• ⏱️ **24 ساعة متوسط سرعة الصيانة**.\n• 🗺️ دمياط - الزرقا - المياسرة.'
            ]
        },
        {
            patterns: ['شكرا', 'thanks', 'thank', 'شكراً', 'ممتاز', 'عظيم', 'تمام'],
            replies: [
                '😊 العفو! يسعدنا خدمتك دائماً. هل هناك شيء آخر؟',
                '🌟 شكراً لثقتك في YAS! نحن دائماً في خدمتك.'
            ]
        },
        {
            patterns: ['اغلق', 'مع السلامة', 'bye', 'goodbye', 'باي', 'وداع'],
            replies: [
                '👋 مع السلامة! إذا احتجت أي مساعدة — أنا هنا دائماً. 😊'
            ]
        },
        {
            patterns: ['ضمان', 'warranty', 'كفالة', 'فترة ضمان'],
            replies: [
                '🛡️ ضمان YAS الشامل:\n\n• **90 يوم ضمان كامل** على جميع الإصلاحات وقطع الغيار.\n• يشمل الضمان أي عطل يحدث في نفس الجزء الذي تم إصلاحه.\n• ضمان على قطع الغيار الأصلية المستخدمة.\n\nلراحتك بالكامل وثقة تامة في خدماتنا!'
            ]
        },
        {
            patterns: ['عنوان', 'مكان', 'فيين', 'وين', 'location', 'address'],
            replies: [
                '📍 عنواننا:\n\n**دمياط - الزرقا - المياسرة**\n\nيمكنك الوصول إلينا بسهولة، ونوفر خدمات الاستلام والتسليم.\n\n📞 للتواصل: 01013791517'
            ]
        },
        {
            patterns: ['ساعات العمل', 'متى تفتحون', 'وقت', 'opening', 'hours'],
            replies: [
                '🕐 ساعات العمل:\n\nمن **8 صباحاً حتى 4:30 مساءً**\nسبعة أيام في الأسبوع\n\nيمكنك حجز موعد أو استلام جهازك في أي وقت خلال هذه الساعات.'
            ]
        },
        {
            patterns: ['لوحة أم', 'motherboard', 'logic board', 'بورد', 'مذربورد'],
            replies: [
                '🔧 صيانة اللوحة الأم:\n\nنحن متخصصون في إصلاح اللوحة الأم (Motherboard) لجميع أنواع اللابتوب:\n• إصلاح دوائر الباور والشحن\n• إصلاح دوائر الرام والمعالج\n• إصلاح دوائر الشاشة والرسوميات\n• إصلاح دوائر USB والمنافذ\n\nنستخدم معدات متقدمة وفنيين خبراء في إصلاح الدوائر الإلكترونية الدقيقة.'
            ]
        },
        {
            patterns: ['واي فاي', 'wifi', 'شبكة', 'network', 'انترنت', 'اتصال'],
            replies: [
                '📡 حلول الشبكة والإنترنت:\n\n• فحص وإصلاح كارت الواي فاي الداخلي\n• إصلاح مشاكل الاتصال بالشبكات\n• تثبيت وتعريف كارت الشبكة الخارجي\n• استكشاف أخطاء الاتصال وحلها\n\nنضمن لك اتصالاً مستقراً وسريعاً!'
            ]
        },
        {
            patterns: ['استعادة', 'بيانات', 'data recovery', 'ملفات محذوفة', 'ضاع'],
            replies: [
                '💾 استعادة البيانات:\n\n• استعادة الملفات المحذوفة عن طريق الخطأ\n• استعادة البيانات من الهارد التالف\n• استعادة البيانات بعد الفورمات\n• استعادة الصور والفيديوهات والمستندات\n\nنستخدم برامج متقدمة وأجهزة خاصة لاستعادة بياناتك بأمان تام.'
            ]
        }
    ];

    const DEFAULT_REPLIES = [
        '🤔 لم أفهم سؤالك جيداً. يمكنك الاختيار من خيارات التشخيص السريع بالأسفل، أو السؤال عن:\n• الأسعار والتكلفة\n• مدة الإصلاح\n• التواصل معنا عبر واتساب',
        '💭 عذراً، لم أستوعب المشكلة بدقة. يمكنك التواصل مباشرة مع فني الصيانة على 01013791517'
    ];

    // ===================================
    // DIAGNOSTIC DECISION TREE (Interactive)
    // ===================================
    const DIAGNOSTICS = {
        title: '🛠️ معالج التشخيص الذاتي لعطل اللابتوب:',
        intro: 'يرجى اختيار العرض أو العطل الذي يواجه جهازك للحصول على تشخيص مبدئي وتكلفة تقديرية عند التواصل:',
        options: [
            {
                label: '🔋 اللابتوب لا يشحن أو لا يعمل نهائياً',
                reply: '🔋 **التشخيص المحتمل:**\n1. الشاحن تالف (يتوفر لدينا شواحن بديلة أصلية لجميع الموديلات).\n2. منفذ الشحن مكسور أو مفكوك (نصلحه باحترافية بالمركز).\n3. عطل في دائرة الباور باللوحة الأم.\n\n💡 **السعر:** الفحص مجاني بالكامل! ونوفر لك التكلفة بدقة عند التواصل معنا.\n📞 <a href="https://wa.me/201013791517" target="_blank" class="chat-link">اضغط هنا للاستفسار عن التكلفة عبر واتساب</a>'
            },
            {
                label: '🖥️ الشاشة سوداء أو مكسورة أو بها خطوط',
                reply: '🖥️ **التشخيص المحتمل:**\n1. شاشة مكسورة بالكامل (يتطلب استبدالها بشاشة أصلية جديدة، تختلف حسب حجم وموديل الشاشة).\n2. كابل الشاشة (Focal Cable) مفكوك أو تالف.\n3. عطل في رامات الجهاز.\n\n💡 **السعر:** الفحص مجاني بالكامل! يرجى التواصل معنا وتزويدنا بموديل جهازك للحصول على سعر الشاشة بدقة.\n📞 <a href="https://wa.me/201013791517" target="_blank" class="chat-link">اضغط هنا للاستفسار عن السعر عبر واتساب</a>'
            },
            {
                label: '🌡️ سخونة شديدة وصوت مروحة مزعج أو تعليق الجهاز',
                reply: '🌡️ **التشخيص المحتمل:**\n1. جفاف المعجون الحراري للمعالج وتراكم الأتربة بالمراوح (يتطلب تنظيف شامل واستبدال معجون حراري أصلي بالمركز).\n2. المروحة مكسورة أو تالفة وتحتاج لاستبدال.\n\n💡 **السعر:** يرجى التواصل معنا للحصول على سعر الخدمة الفوري لجهازك.\n📞 <a href="https://wa.me/201013791517" target="_blank" class="chat-link">اضغط هنا للاستفسار عبر واتساب</a>'
            },
            {
                label: '🐌 الجهاز بطيء جداً ويستغرق وقتاً طويلاً للفتح',
                reply: '🐌 **التشخيص المحتمل:**\n1. الهارد الحالي HDD قديم أو ممتلئ أو يحتوي على قطاعات تالفة.\n2. امتلاء الرام بالبرامج ووجود فيروسات.\n\n💡 **الحل السحري:** ترقية الهارد إلى SSD مع زيادة الرام وتثبيت ويندوز نظيف لجعل جهازك أسرع 10 مرات! تواصل معنا لمعرفة تكلفة الترقية المناسبة لجهازك.\n📞 <a href="https://wa.me/201013791517" target="_blank" class="chat-link">اضغط هنا لمعرفة تكلفة الترقية عبر واتساب</a>'
            },
            {
                label: '⌨️ بعض أزرار الكيبورد لا تعمل أو انسكب عليها سائل',
                reply: '⌨️ **التشخيص المحتمل:**\n1. تلف المسارات الداخلية للكيبورد نتيجة الرطوبة أو انسكاب السوائل (يتطلب استبدال الكيبورد بكيبورد جديد أصلي).\n2. تعليق برمجيات التعريفات.\n\n💡 **السعر:** تواصل معنا مع إرسال موديل اللابتوب للحصول على السعر الدقيق لاستبدال الكيبورد.\n📞 <a href="https://wa.me/201013791517" target="_blank" class="chat-link">اضغط هنا للاستفسار عبر واتساب</a>'
            }
        ]
    };

    // ==============================
    // BUILD CHATBOT UI
    // ==============================
    function buildChatbot() {
        const html = `
        <div id="yas-chatbot">
            <!-- Toggle Button -->
            <button id="chat-toggle" aria-label="فتح المحادثة">
                <span class="chat-icon-open"><i class="fas fa-comment-dots"></i></span>
                <span class="chat-icon-close"><i class="fas fa-times"></i></span>
                <span class="chat-badge" id="chat-badge">1</span>
            </button>

            <!-- Chat Window -->
            <div id="chat-window" class="chat-window">
                <!-- Header -->
                <div class="chat-header">
                    <div class="chat-agent">
                        <div class="chat-avatar">
                            <img src="assets/images/yas-logo.svg" alt="YAS" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="avatar-fallback"><i class="fas fa-robot"></i></div>
                        </div>
                        <div class="chat-agent-info">
                            <strong>مساعد YAS الذكي v2.0</strong>
                            <span class="chat-status"><span class="status-dot"></span> متصل الآن</span>
                        </div>
                    </div>
                    <button id="chat-close" aria-label="إغلاق"><i class="fas fa-times"></i></button>
                </div>

                <!-- Messages -->
                <div id="chat-messages" class="chat-messages"></div>

                <!-- Quick Replies -->
                <div class="chat-quick-replies" id="quick-replies">
                    <button class="quick-reply" data-action="diagnose">🛠️ تشخيص الأعطال</button>
                    <button class="quick-reply" data-msg="ما هي الأسعار؟">💰 الأسعار</button>
                    <button class="quick-reply" data-msg="كيف أقدم طلب صيانة؟">🔧 طلب صيانة</button>
                </div>

                <!-- Input -->
                <div class="chat-input-area">
                    <input id="chat-input" type="text" placeholder="اكتب مشكلة لابتوبك هنا..." autocomplete="off" dir="auto">
                    <button id="chat-send"><i class="fas fa-paper-plane"></i></button>
                </div>
            </div>
        </div>`;

        const div = document.createElement('div');
        div.innerHTML = html;
        document.body.appendChild(div.firstElementChild);

        injectStyles();
        attachEvents();

        // Show welcome after delay
        setTimeout(showWelcome, 1500);
    }

    // ==============================
    // STYLES (injected)
    // ==============================
    function injectStyles() {
        const css = `
        #yas-chatbot {
            position: fixed;
            bottom: 24px;
            left: 24px;
            z-index: 9999;
            font-family: 'Tajawal', 'Cairo', sans-serif;
        }

        /* Toggle button */
        #chat-toggle {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #1e3cff, #00f2fe);
            border: none;
            cursor: pointer;
            box-shadow: 0 8px 30px rgba(30,60,255,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.4rem;
            color: white;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            animation: chatPulse 2.5s ease-in-out infinite;
        }

        @keyframes chatPulse {
            0%, 100% { box-shadow: 0 8px 30px rgba(30,60,255,0.4), 0 0 0 0 rgba(30,60,255,0.3); }
            50% { box-shadow: 0 8px 30px rgba(30,60,255,0.5), 0 0 0 12px rgba(30,60,255,0); }
        }

        #chat-toggle:hover {
            transform: scale(1.1) rotate(5deg);
            box-shadow: 0 12px 40px rgba(30,60,255,0.6);
            animation: none;
        }

        #chat-toggle.active {
            animation: none;
            box-shadow: 0 0 20px rgba(0, 242, 254, 0.6);
        }

        .chat-icon-close { display: none; }
        #chat-toggle.active .chat-icon-open { display: none; }
        #chat-toggle.active .chat-icon-close { display: flex; }

        .chat-badge {
            position: absolute;
            top: -4px;
            right: -4px;
            background: #ef4444;
            color: white;
            font-size: 0.7rem;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            border: 2px solid white;
            transition: all 0.3s ease;
        }

        .chat-badge.hidden { opacity: 0; transform: scale(0); }

        /* Chat window with glassmorphism & elastic opening animation */
        .chat-window {
            position: absolute;
            bottom: 75px;
            left: 0;
            width: 380px;
            height: 520px;
            max-height: 80vh;
            background: rgba(8, 12, 26, 0.85);
            backdrop-filter: blur(25px);
            -webkit-backdrop-filter: blur(25px);
            border: 1px solid rgba(0, 242, 254, 0.25);
            border-radius: 24px;
            box-shadow: 0 24px 70px rgba(0, 0, 0, 0.7), 
                        0 0 20px rgba(30, 60, 255, 0.15),
                        inset 0 1px 0 rgba(255, 255, 255, 0.1);
            overflow: hidden;
            display: none;
            flex-direction: column;
            transform-origin: bottom left;
            transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
        }

        .chat-window.active {
            display: flex;
            animation: chatSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes chatSlideIn {
            from { opacity: 0; transform: scale(0.85) translateY(30px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* Header */
        .chat-header {
            background: linear-gradient(135deg, rgba(30, 60, 255, 0.95), rgba(0, 11, 179, 0.95));
            padding: 16px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .chat-agent {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .chat-avatar {
            width: 42px;
            height: 42px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.15);
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid rgba(255, 255, 255, 0.3);
        }

        .chat-avatar img { width: 36px; height: 36px; object-fit: contain; }

        .avatar-fallback {
            display: none;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            font-size: 1.2rem;
            color: white;
        }

        .chat-agent-info strong {
            display: block;
            color: white;
            font-size: 0.92rem;
        }

        .chat-status {
            display: flex;
            align-items: center;
            gap: 5px;
            color: rgba(255, 255, 255, 0.85);
            font-size: 0.72rem;
        }

        .status-dot {
            width: 7px;
            height: 7px;
            background: #00f2fe;
            border-radius: 50%;
            animation: blink 2s ease-in-out infinite;
            box-shadow: 0 0 6px #00f2fe;
        }

        @keyframes blink {
            0%, 100% { opacity: 1; } 50% { opacity: 0.4; }
        }

        #chat-close {
            background: rgba(255, 255, 255, 0.15);
            border: none;
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.85rem;
            transition: background 0.2s;
        }
        #chat-close:hover { background: rgba(255, 255, 255, 0.3); }

        /* Messages area */
        .chat-messages {
            flex: 1;
            padding: 18px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 16px;
            scrollbar-width: thin;
            scrollbar-color: rgba(0, 242, 254, 0.3) transparent;
        }

        .chat-messages::-webkit-scrollbar { width: 4px; }
        .chat-messages::-webkit-scrollbar-thumb { background: rgba(0, 242, 254, 0.3); border-radius: 2px; }

        /* Bubble container holding controls and content */
        .chat-msg-container {
            display: flex;
            flex-direction: column;
            max-width: 85%;
            opacity: 0;
            transform: scale(0.9) translateY(20px);
            animation: msgIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .chat-msg-container.bot { align-self: flex-start; }
        .chat-msg-container.user { align-self: flex-end; }

        .chat-msg {
            padding: 12px 16px;
            font-size: 0.88rem;
            line-height: 1.65;
            direction: rtl;
            text-align: right;
            position: relative;
        }

        @keyframes msgIn {
            to {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }

        /* Asymmetrical modern bubble styling for RTL context */
        .chat-msg.bot {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.08);
            color: #f1f5f9;
            border-radius: 18px 18px 4px 18px; /* Curve that drops to right tail in RTL */
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .chat-msg.user {
            background: linear-gradient(135deg, #1e3cff, #00f2fe);
            color: white;
            border-radius: 18px 18px 18px 4px; /* Curve that drops to left tail in RTL */
            box-shadow: 0 6px 20px rgba(30, 60, 255, 0.35);
        }

        .chat-msg a.chat-link {
            color: #00f2fe;
            text-decoration: underline;
            display: inline-block;
            margin-top: 5px;
            font-weight: bold;
        }

        /* Message bottom meta - feedback & read button */
        .chat-msg-meta {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 6px;
            padding: 0 4px;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        .chat-msg-container:hover .chat-msg-meta { opacity: 0.75; }
        .chat-msg-meta:hover { opacity: 1 !important; }

        .chat-meta-btn {
            background: none;
            border: none;
            color: #94a3b8;
            cursor: pointer;
            font-size: 0.75rem;
            padding: 2px 4px;
            display: flex;
            align-items: center;
            gap: 4px;
            transition: all 0.2s;
        }
        .chat-meta-btn:hover { color: #00f2fe; transform: scale(1.15); }
        .chat-meta-btn.voted { color: #10b981 !important; pointer-events: none; }

        /* Dynamic Options Buttons */
        .chat-options-box {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-top: 10px;
            width: 100%;
        }

        .chat-option-btn {
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.08);
            color: #e2e8f0;
            padding: 10px 14px;
            border-radius: 14px;
            font-size: 0.85rem;
            cursor: pointer;
            text-align: right;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            font-family: inherit;
            width: 100%;
        }

        .chat-option-btn:hover {
            background: rgba(30, 60, 255, 0.25);
            border-color: #00f2fe;
            color: white;
            transform: translateX(-4px);
            box-shadow: 0 0 10px rgba(0, 242, 254, 0.2);
        }

        /* Typing indicator */
        .typing-indicator {
            display: flex;
            align-items: center;
            gap: 5px;
            padding: 10px 14px;
            background: rgba(30,60,255,0.1);
            border: 1px solid rgba(30,60,255,0.25);
            border-radius: 18px;
            border-bottom-right-radius: 4px;
            align-self: flex-start;
            width: fit-content;
            margin-bottom: 5px;
        }

        .typing-dot {
            width: 7px;
            height: 7px;
            background: #00f2fe;
            border-radius: 50%;
            animation: typingBounce 1.2s ease infinite;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typingBounce {
            0%,80%,100% { transform: translateY(0); }
            40% { transform: translateY(-8px); }
        }

        /* Quick replies */
        .chat-quick-replies {
            display: flex;
            gap: 6px;
            padding: 8px 12px;
            overflow-x: auto;
            scrollbar-width: none;
            border-top: 1px solid rgba(255,255,255,0.06);
        }
        .chat-quick-replies::-webkit-scrollbar { display: none; }

        .quick-reply {
            white-space: nowrap;
            padding: 6px 14px;
            background: rgba(30,60,255,0.15);
            border: 1px solid rgba(30,60,255,0.3);
            color: #93c5fd;
            border-radius: 20px;
            font-size: 0.78rem;
            cursor: pointer;
            transition: all 0.25s;
            font-family: inherit;
        }

        .quick-reply:hover {
            background: rgba(30,60,255,0.35);
            border-color: #00f2fe;
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 4px 10px rgba(30,60,255,0.2);
        }

        /* Input */
        .chat-input-area {
            display: flex;
            gap: 8px;
            padding: 12px;
            border-top: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.03);
        }

        #chat-input {
            flex: 1;
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 12px;
            padding: 9px 12px;
            color: white;
            font-size: 0.85rem;
            font-family: inherit;
            outline: none;
            transition: all 0.25s;
        }

        #chat-input:focus {
            border-color: rgba(30,60,255,0.65);
            background: rgba(255,255,255,0.1);
            box-shadow: 0 0 8px rgba(30,60,255,0.25);
        }

        #chat-input::placeholder { color: rgba(255,255,255,0.35); }

        #chat-send {
            width: 38px;
            height: 38px;
            background: linear-gradient(135deg, #1e3cff, #6c8dff);
            border: none;
            border-radius: 12px;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.9rem;
            transition: all 0.2s;
            flex-shrink: 0;
        }

        #chat-send:hover {
            transform: scale(1.08);
            box-shadow: 0 4px 15px rgba(30,60,255,0.5);
        }

        /* Feedback Toast styling inside chat */
        .chat-feedback-toast {
            align-self: center;
            font-size: 0.72rem;
            background: rgba(16, 185, 129, 0.15);
            border: 1px solid rgba(16, 185, 129, 0.3);
            color: #10b981;
            padding: 4px 10px;
            border-radius: 10px;
            margin: 4px 0;
            animation: msgIn 0.3s ease;
        }

        /* Light mode overrides */
        body.light-mode .chat-window {
            background: rgba(240,244,255,0.98);
            border-color: rgba(30,60,255,0.2);
            box-shadow: 0 20px 60px rgba(30,60,255,0.15);
        }

        body.light-mode .chat-msg.bot {
            background: rgba(30,60,255,0.07);
            border-color: rgba(30,60,255,0.15);
            color: #0f172a;
        }

        body.light-mode #chat-input {
            background: rgba(255,255,255,0.85);
            border-color: rgba(30,60,255,0.2);
            color: #0f172a;
        }

        body.light-mode #chat-input::placeholder { color: #64748b; }
        body.light-mode .chat-input-area { background: rgba(255,255,255,0.5); }
        body.light-mode .quick-reply { color: #1e3cff; background: rgba(30,60,255,0.08); }
        body.light-mode .chat-messages { scrollbar-color: rgba(30,60,255,0.2) transparent; }
        body.light-mode .chat-option-btn {
            background: rgba(255,255,255,0.8);
            border-color: rgba(30,60,255,0.15);
            color: #1e293b;
        }
        body.light-mode .chat-option-btn:hover {
            background: rgba(30,60,255,0.1);
            color: #1e3cff;
        }

        @media (max-width: 400px) {
            .chat-window { width: 300px; }
        }
        `;

        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }

    // ==============================
    // EVENTS & HANDLERS
    // ==============================
    function attachEvents() {
        const toggle = document.getElementById('chat-toggle');
        const window_ = document.getElementById('chat-window');
        const closeBtn = document.getElementById('chat-close');
        const input = document.getElementById('chat-input');
        const sendBtn = document.getElementById('chat-send');
        const badge = document.getElementById('chat-badge');
        const quickReplies = document.getElementById('quick-replies');

        toggle.addEventListener('click', () => {
            const isOpen = window_.classList.toggle('active');
            toggle.classList.toggle('active', isOpen);
            badge.classList.add('hidden');
            AudioSynth.playPop();
            if (isOpen) input.focus();
        });

        closeBtn.addEventListener('click', () => {
            window_.classList.remove('active');
            toggle.classList.remove('active');
            AudioSynth.playPop();
        });

        sendBtn.addEventListener('click', sendMessage);

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            } else {
                // Play subtle keyboard click sound
                AudioSynth.playKeypress();
            }
        });

        quickReplies.addEventListener('click', (e) => {
            const btn = e.target.closest('.quick-reply');
            if (!btn) return;
            
            const msg = btn.dataset.msg;
            const action = btn.dataset.action;
            
            AudioSynth.playPop();
            
            if (msg) {
                addMessage(msg, 'user');
                setTimeout(() => respondTo(msg), 700);
            } else if (action === 'diagnose') {
                addMessage('🛠️ أريد تشخيص عطل في اللابتوب', 'user');
                setTimeout(showDiagnosticOptions, 700);
            }
        });
    }

    function scrollToBottom() {
        const messages = document.getElementById('chat-messages');
        if (messages) {
            setTimeout(() => {
                messages.scrollTo({
                    top: messages.scrollHeight,
                    behavior: 'smooth'
                });
            }, 50);
        }
    }

    function showWelcome() {
        const badge = document.getElementById('chat-badge');
        badge.classList.remove('hidden');
        AudioSynth.playNotification();
        addMessage('👋 مرحباً بك في مركز YAS لصيانة اللابتوب!\nأنا مساعدك الذكي. كيف يمكنني خدمتك اليوم؟ 😊', 'bot');
    }

    function sendMessage() {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        input.value = '';

        // Show typing
        const typing = showTyping();
        const delay = 600 + Math.random() * 800;

        setTimeout(() => {
            removeTyping(typing);
            respondTo(text);
        }, delay);
    }

    function addMessage(text, sender) {
        const messages = document.getElementById('chat-messages');
        
        // Message Container holding controls + bubble
        const container = document.createElement('div');
        container.className = `chat-msg-container ${sender}`;
        
        // Bubble
        const bubble = document.createElement('div');
        bubble.className = `chat-msg ${sender}`;
        bubble.innerHTML = text.replace(/\n/g, '<br>');
        container.appendChild(bubble);

        // Controls (only for bot responses)
        if (sender === 'bot') {
            const meta = document.createElement('div');
            meta.className = 'chat-msg-meta';
            
            // Audio Speech Button
            const speechBtn = document.createElement('button');
            speechBtn.className = 'chat-meta-btn';
            speechBtn.innerHTML = '<i class="fas fa-volume-up"></i> استماع';
            speechBtn.onclick = () => speakText(text, speechBtn);
            meta.appendChild(speechBtn);

            // Thumbs Up feedback
            const likeBtn = document.createElement('button');
            likeBtn.className = 'chat-meta-btn';
            likeBtn.innerHTML = '<i class="far fa-thumbs-up"></i> مفيد';
            likeBtn.onclick = () => submitFeedback(likeBtn, true);
            meta.appendChild(likeBtn);

            // Thumbs Down feedback
            const dislikeBtn = document.createElement('button');
            dislikeBtn.className = 'chat-meta-btn';
            dislikeBtn.innerHTML = '<i class="far fa-thumbs-down"></i> غير مفيد';
            dislikeBtn.onclick = () => submitFeedback(dislikeBtn, false);
            meta.appendChild(dislikeBtn);

            container.appendChild(meta);
            AudioSynth.playNotification();
        }

        messages.appendChild(container);
        scrollToBottom();
    }

    // Diagnostics Wizard options
    function showDiagnosticOptions() {
        const messages = document.getElementById('chat-messages');
        const container = document.createElement('div');
        container.className = 'chat-msg-container bot';

        const bubble = document.createElement('div');
        bubble.className = 'chat-msg bot';
        bubble.innerHTML = `<strong>${DIAGNOSTICS.title}</strong><br>${DIAGNOSTICS.intro}`;
        
        const optionsBox = document.createElement('div');
        optionsBox.className = 'chat-options-box';
        
        DIAGNOSTICS.options.forEach((opt, idx) => {
            const optBtn = document.createElement('button');
            optBtn.className = 'chat-option-btn';
            optBtn.textContent = opt.label;
            optBtn.onclick = () => {
                AudioSynth.playPop();
                addMessage(opt.label, 'user');
                // Trigger typing & reply
                const typing = showTyping();
                setTimeout(() => {
                    removeTyping(typing);
                    addMessage(opt.reply, 'bot');
                }, 800);
            };
            optionsBox.appendChild(optBtn);
        });

        bubble.appendChild(optionsBox);
        container.appendChild(bubble);
        messages.appendChild(container);
        scrollToBottom();
        AudioSynth.playNotification();
    }

    // Text to Speech
    function speakText(text, btn) {
        if ('speechSynthesis' in window) {
            // Cancel current speech
            window.speechSynthesis.cancel();
            
            // Clean text from HTML tags for speech
            const cleanText = text.replace(/<[^>]*>/g, '').trim();

            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.lang = 'ar-EG'; // Egyptian Arabic vocalization if supported
            
            // Find an Arabic voice if available
            const voices = window.speechSynthesis.getVoices();
            const arVoice = voices.find(v => v.lang.includes('ar'));
            if (arVoice) utterance.voice = arVoice;

            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> يتحدث...';
            
            utterance.onend = () => {
                btn.innerHTML = '<i class="fas fa-volume-up"></i> استماع';
            };
            
            utterance.onerror = () => {
                btn.innerHTML = '<i class="fas fa-volume-up"></i> استماع';
            };

            window.speechSynthesis.speak(utterance);
        } else {
            alert('متصفحك الحالي لا يدعم قراءة النصوص صوتياً.');
        }
    }

    // Submit Feedback
    function submitFeedback(btn, isPositive) {
        const meta = btn.parentNode;
        const buttons = meta.querySelectorAll('.chat-meta-btn');
        buttons.forEach(b => {
            b.classList.remove('voted');
            b.style.pointerEvents = 'none';
        });
        
        btn.classList.add('voted');
        btn.innerHTML = isPositive ? '<i class="fas fa-thumbs-up"></i> تم التقييم' : '<i class="fas fa-thumbs-down"></i> تم التقييم';
        
        const messages = document.getElementById('chat-messages');
        const toast = document.createElement('div');
        toast.className = 'chat-feedback-toast';
        toast.textContent = '❤️ شكراً لتقييمك! نعمل دائماً لتطوير الذكاء الاصطناعي.';
        messages.appendChild(toast);
        scrollToBottom();
    }

    function showTyping() {
        const messages = document.getElementById('chat-messages');
        const div = document.createElement('div');
        div.className = 'typing-indicator';
        div.innerHTML = `<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>`;
        messages.appendChild(div);
        scrollToBottom();
        return div;
    }

    function removeTyping(el) {
        if (el && el.parentNode) el.parentNode.removeChild(el);
    }

    function normalizeArabic(str) {
        if (!str) return '';
        return str
            .toLowerCase()
            .replace(/[أإآ]/g, 'ا')
            .replace(/ة/g, 'ه')
            .replace(/ى/g, 'ي')
            .replace(/[\u064B-\u065F]/g, '') // remove Arabic diacritics
            .replace(/[؟?.,\/#!$%\^&\*;:{}=\-_`~()]/g, '') // remove punctuation
            .trim();
    }

    function respondTo(text) {
        const cleanInput = normalizeArabic(text);
        
        for (const item of KB) {
            if (item.patterns.some(p => {
                const cleanPattern = normalizeArabic(p);
                return cleanInput.includes(cleanPattern);
            })) {
                const reply = item.replies[Math.floor(Math.random() * item.replies.length)];
                addMessage(reply, 'bot');
                return;
            }
        }
        // Default
        const def = DEFAULT_REPLIES[Math.floor(Math.random() * DEFAULT_REPLIES.length)];
        addMessage(def, 'bot');
    }

    // ==============================
    // INIT
    // ==============================
    document.addEventListener('DOMContentLoaded', buildChatbot);

})();
