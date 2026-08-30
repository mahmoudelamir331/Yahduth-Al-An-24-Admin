-- Seed للبيانات الوهمية الحالية. شغله بعد الـ migration.
insert into public.categories (name, slug) values
 ('أخبار أسوان','aswan'), ('اقتصاد','economy'), ('سياحة وثقافة','reports'), ('تكنولوجيا','tech'), ('سياسة','politics'), ('رياضة','sports')
on conflict (slug) do update set name = excluded.name;

insert into public.site_settings (id, founder_name, founder_description, founder_image_url, founder_contact_url)
values (true, 'فريق يحدث الآن', 'منصة إخبارية محلية تنقل الخبر بمصداقية وسرعة.', '/logo.jpg', '/contact')
on conflict (id) do nothing;

insert into public.static_pages (slug, title, content) values
 ('about','من نحن','["منصة يحدث الآن الإخبارية تقدم تغطية موثوقة للأخبار المحلية والعاجلة."]'::jsonb),
 ('privacy','سياسة الخصوصية','["نحترم خصوصية زوارنا ولا نشارك بياناتهم دون موافقة."]'::jsonb),
 ('terms','الشروط والأحكام','["استخدام الموقع يعني الموافقة على الشروط والأحكام المنشورة."]'::jsonb)
on conflict (slug) do update set title = excluded.title, content = excluded.content;

insert into public.articles (slug, category_id, title, excerpt, content, cover_image_url, author_name, status, is_urgent, published_at, read_minutes)
select v.slug, c.id, v.title, v.excerpt, v.content::jsonb, v.image_url, v.author, 'published', v.urgent, now() - (v.hours || ' hours')::interval, v.read_minutes
from (values
 ('aswan-projects-tour','جولة ميدانية في المشروعات التنموية الكبرى بمحافظة أسوان لتطوير خدمات المواطنين','تغطية شاملة ومباشرة لخطط تطوير كورنيش النيل وخدمات المواطنين.','["شهدت المحافظة جولة تفقدية لمتابعة المشروعات الجاري تنفيذها لرفع كفاءة البنية التحتية.","استعرض المسؤولون نسب التنفيذ في مشروع تطوير كورنيش النيل الجديد."]','/news/corniche.png','محمد الأمين (مراسل أسوان)',true,15,4),
 ('african-investment-forum','انطلاق فعاليات المنتدى الاستثماري الإفريقي لتعزيز التبادل التجاري','مناقشات بين المستثمرين لبحث المشروعات المشتركة وتسهيل حركة الصادرات.','["انطلقت فعاليات المنتدى الاستثماري الإفريقي بمشاركة الخبراء والمستثمرين.","يناقش المنتدى سبل التكامل الاقتصادي بين مصر والدول الإفريقية."]','/news/forum.png','قسم الاقتصاد',false,1,3),
 ('aswan-tourism-season','إقبال سياحي غير مسبوق على معابد فيلة وأبو سمبل','ارتفاع نسب الإشغال الفندقي وسط تدفق السائحين من مختلف دول العالم.','["تشهد أسوان انتعاشة سياحية كبرى وتوافد آلاف السائحين.","سجلت معابد فيلة وأبو سمبل إقبالاً كبيراً."]','/news/temple.png','محمد الأمين',false,2,3),
 ('benban-solar-ai','توسع مشروعات الطاقة الشمسية ببنبان والاعتماد على الذكاء الاصطناعي','تقنيات حديثة لرفع كفاءة إنتاج الطاقة ونقلها للشبكة القومية.','["أعلنت إدارة مجمع بنبان إدخال خوارزميات الذكاء الاصطناعي.","تساهم التقنيات في تقليل الهدر وزيادة كفاءة المحطات."]','/news/solar.png','قسم التكنولوجيا',false,3,4),
 ('handicrafts-complex-aswan','وضع حجر الأساس لمجمع الصناعات الحرفية الجديد بأسوان','المشروع يهدف لتمكين الحرفيين وتطوير المنتجات التراثية النوبية.','["تم وضع حجر الأساس لمشروع مجمع الصناعات الحرفية والتراثية.","يوفر المجمع فرص عمل مباشرة وغير مباشرة لشباب وسيدات أسوان."]','/news/handicrafts.png','محمد الأمين',false,4,3),
 ('government-statement-upper-egypt','بيان رسمي يشيد بتكاتف الجهود التنفيذية لمتابعة المشروعات التنموية','تأكيدات حكومية على أولوية تطوير الخدمات الصحية والتعليمية في صعيد مصر.','["أكد البيان استمرار الدعم الكامل لمشروعات التنمية بمحافظات الصعيد.","تعكس المتابعة المستمرة حرص الدولة على الارتقاء بالخدمات."]','/news/press.png','محمد الأمين',false,5,3),
 ('aswan-sc-match-prep','نادي أسوان يستعد لمواجهة مرتقبة في الدوري الممتاز','جاهزية تامة للفريق وتصريحات حول الخطط التكتيكية للمباراة القادمة.','["ينهي الفريق تدريباته استعداداً لمباراته المقبلة في منافسات الدوري.","أبدى الجهاز الفني ثقته في عناصر الفريق."]','/news/sports.png','القسم الرياضي',false,6,3),
 ('digital-portals-launch','إطلاق بوابات رقمية جديدة لتسهيل المعاملات الحكومية الإلكترونية','المنظومة الجديدة تتيح تقديم الطلبات والاستعلام عن الخدمات من الهاتف المحمول.','["تم إطلاق مجموعة من البوابات الرقمية الجديدة للخدمات الحكومية.","تتيح البوابة إنجاز المعاملات وتتبع الطلبات بسهولة وأمان."]','/news/digital.png','قسم التكنولوجيا',false,7,2),
 ('agricultural-export-aswan','ارتفاع مؤشرات التصدير للمنتجات الزراعية المصرية','تقرير اقتصادي يرصد زيادة صادرات التمور والنباتات الطبية والعطرية.','["أظهرت التقارير ارتفاعاً ملموساً في حجم الصادرات الزراعية المصرية.","سجلت تمور أسوان والنباتات الطبية إقبالاً كبيراً."]','/news/dates.png','محمد الأمين',false,8,3),
 ('investigation-benban-renewable-energy','تحقيق صحفي: كيف تحولت أسوان لعاصمة الطاقة المتجددة؟','دراسة استقصائية ترصد قصة نجاح مشروع بنبان ودعمه لشبكة الكهرباء.','["نسلط الضوء على تجربة تحول أسوان إلى مركز عالمي للطاقة النظيفة.","أسهم مشروع بنبان في دعم الاقتصاد القومي وتخفيض الانبعاثات."]','/news/renewable.png','محمد الأمين',false,9,5)
) as v(slug,title,excerpt,content,image_url,author,urgent,hours,read_minutes)
join public.categories c on c.slug = case
  when v.slug in ('aswan-projects-tour','handicrafts-complex-aswan') then 'aswan'
  when v.slug in ('african-investment-forum','agricultural-export-aswan') then 'economy'
  when v.slug in ('aswan-tourism-season','investigation-benban-renewable-energy') then 'reports'
  when v.slug in ('benban-solar-ai','digital-portals-launch') then 'tech'
  when v.slug = 'government-statement-upper-egypt' then 'politics'
  else 'sports'
 end
on conflict (slug) do update set title=excluded.title, excerpt=excluded.excerpt, content=excluded.content, cover_image_url=excluded.cover_image_url, author_name=excluded.author_name, status='published';
