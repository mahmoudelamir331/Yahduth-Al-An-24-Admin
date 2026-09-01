"use client";

import { FormEvent, type ReactNode, useMemo, useState } from "react";
import { Check, ChevronDown, CheckSquare, KeyRound, LockKeyhole, Newspaper, Image as ImageIcon, Megaphone, Settings, Users, X, Info, Edit3, PowerOff, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type Profile = { id: string; full_name: string; role: string; is_active: boolean };
type Permission = { key: string; label: string; description: string };
type StaffMember = Profile & { user_permissions: { permission_key: string }[] };
type Props = { staff: StaffMember[]; permissions: Permission[]; notice: string; currentUserId: string; onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>; onReload: () => Promise<void> };

const roleLabels: Record<string, string> = {
  super_admin: "المالك",
  manager: "مدير",
  editor: "محرر",
  advertiser: "مسؤول إعلانات",
};

const groups = [
  {
    title: "الأخبار",
    icon: Newspaper,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    keys: [
      { key: "news.view", label: "مشاهدة الأخبار" },
      { key: "news.create", label: "إضافة خبر جديد" },
      { key: "news.edit.own", label: "تعديل أخباره فقط" },
      { key: "news.edit.any", label: "تعديل أخبار الكل" },
      { key: "news.publish", label: "نشر الأخبار" },
      { key: "news.review", label: "مراجعة المسودات" },
      { key: "news.archive", label: "أرشفة الأخبار" },
      { key: "news.delete", label: "حذف الأخبار" },
    ]
  },
  {
    title: "الميديا",
    icon: ImageIcon,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    keys: [
      { key: "media.view", label: "مشاهدة المكتبة" },
      { key: "media.upload", label: "رفع صور/فيديو" },
      { key: "media.delete", label: "حذف ميديا" },
      { key: "media.watermark", label: "التحكم في العلامة المائية" },
    ]
  },
  {
    title: "الإعلانات",
    icon: Megaphone,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    keys: [
      { key: "ads.view", label: "مشاهدة الإعلانات" },
      { key: "ads.create", label: "إضافة إعلان" },
      { key: "ads.toggle", label: "إيقاف/تفعيل إعلان" },
    ]
  },
  {
    title: "الإعدادات",
    icon: Settings,
    color: "text-red-500",
    bg: "bg-red-500/10",
    keys: [
      { key: "settings.edit", label: "تعديل إعدادات الموقع" },
      { key: "settings.maintenance", label: "تفعيل وضع الصيانة" },
      { key: "settings.social", label: "إدارة السوشيال ميديا" },
      { key: "users.manage", label: "إدارة حسابات الموظفين" },
    ]
  },
];

const roleTemplates: Record<string, string[]> = {
  manager: ["news.view", "news.create", "news.edit.own", "news.edit.any", "news.review", "news.publish", "news.archive", "news.delete", "media.view", "media.upload", "media.delete", "media.watermark", "ads.view", "ads.create", "ads.toggle", "settings.edit", "settings.maintenance", "settings.social"],
  editor: ["news.view", "news.create", "news.edit.own", "news.review", "media.view", "media.upload"],
  advertiser: ["ads.view", "ads.create", "ads.toggle", "media.view"],
};

export default function TeamManager({ staff, permissions, notice, currentUserId, onSubmit, onReload }: Props) {
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [roleTemplate, setRoleTemplate] = useState("editor");
  const [passwordTarget, setPasswordTarget] = useState<StaffMember | null>(null);
  const [busy, setBusy] = useState("");
  const supabase = useMemo(() => createClient(), []);

  async function action(targetId: string, actionName: string, payload: Record<string, unknown> = {}) {
    setBusy(targetId + actionName);
    const session = (await supabase.auth.getSession()).data.session;
    const response = await fetch("/api/admin/staff", { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` }, body: JSON.stringify({ targetId, action: actionName, ...payload }) });
    const result = await response.json();
    setBusy("");
    if (!response.ok) window.alert(result.message);
    else { setPasswordTarget(null); setEditing(null); await onReload(); }
  }

  return (
    <>
      <div className="mb-8">
        <p className="text-primary font-bold text-sm mb-1">المالك فقط</p>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-foreground to-foreground/60 block">إدارة الفريق والصلاحيات</h1>
        <span className="text-sm opacity-70 mt-2 block">تحكم في الحسابات وخصص الصلاحيات بالتفصيل لكل موظف</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-6 mb-8">
        {/* Add Staff Form */}
        <section className="glass-card p-6 md:p-8">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-glass-border/30">
            <div className="bg-primary/20 p-3 rounded-full text-primary"><Users size={22} /></div>
            <div>
              <h2 className="text-xl font-bold">إضافة موظف جديد</h2>
              <p className="text-sm opacity-70 mt-1">اختر القالب الوظيفي كنقطة بداية ثم خصص الصلاحيات</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold">الدور الوظيفي (قالب)</label>
                <select name="role" className="glass-input h-11" value={roleTemplate} onChange={(e) => setRoleTemplate(e.target.value)}>
                  <option value="manager" className="text-black">مدير — أغلب الصلاحيات</option>
                  <option value="editor" className="text-black">محرر — أخبار وميديا</option>
                  <option value="advertiser" className="text-black">مسؤول إعلانات</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold">الاسم بالكامل</label>
                <input name="fullName" className="glass-input h-11" required placeholder="اسم الموظف" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold">البريد الإلكتروني</label>
                <input name="email" type="email" className="glass-input h-11" required placeholder="name@yahduth.com" dir="ltr" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold">كلمة المرور</label>
                <input name="password" type="password" className="glass-input h-11" minLength={8} required placeholder="8 رموز على الأقل" dir="ltr" />
              </div>
            </div>

            <div className="mt-2">
              <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                <LockKeyhole size={17} className="text-primary" />
                الصلاحيات الدقيقة
              </h3>
              <PermissionGroups permissions={permissions} defaultSelected={roleTemplates[roleTemplate]} />
            </div>

            {notice && (
              <div className="bg-primary/10 border border-primary/20 text-primary p-3 rounded-lg text-sm flex items-center gap-2">
                <Info size={16} /> {notice}
              </div>
            )}

            <button className="glass-button glass-button-primary w-full h-12 text-lg mt-2 shadow-xl shadow-primary/20" type="submit">
              إضافة الموظف وتحديد الصلاحيات
            </button>
          </form>
        </section>

        {/* Role Summary Panel */}
        <section className="glass-card p-6 self-start xl:sticky xl:top-6">
          <h2 className="text-base font-bold mb-4 flex items-center gap-2 pb-4 border-b border-glass-border/30">
            <CheckSquare size={18} className="text-primary" /> ملخص القالب المختار
          </h2>
          <div className="flex flex-col gap-2">
            {groups.map(({ title, icon: Icon, color, bg, keys }) => {
              const activeKeys = keys.filter(k => roleTemplates[roleTemplate]?.includes(k.key));
              if (activeKeys.length === 0) return null;
              return (
                <div key={title} className="flex flex-col gap-1.5">
                  <div className={cn("flex items-center gap-2 text-xs font-bold py-1", color)}>
                    <span className={cn("p-1 rounded", bg)}><Icon size={12} /></span>
                    {title}
                  </div>
                  {activeKeys.map(k => (
                    <div key={k.key} className="flex items-center gap-2 pr-6 py-0.5">
                      <div className="w-1 h-1 rounded-full bg-current opacity-40 shrink-0" />
                      <span className="text-xs opacity-80">{k.label}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Staff Table */}
      <section className="glass-card p-6 md:p-8">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-glass-border/30">
          <div className="bg-white/10 dark:bg-black/20 border border-glass-border p-3 rounded-full"><Users size={22} /></div>
          <div>
            <h2 className="text-xl font-bold">جدول الموظفين الحاليين</h2>
            <p className="text-sm opacity-70 mt-1">{staff.length} حسابات مسجلة</p>
          </div>
        </div>

        <div className="overflow-auto rounded-xl border border-glass-border/40">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-white/50 dark:bg-black/40 border-b border-glass-border/40 text-right">
                <th className="px-4 py-3 font-bold opacity-70">الاسم</th>
                <th className="px-4 py-3 font-bold opacity-70">البريد / الموبايل</th>
                <th className="px-4 py-3 font-bold opacity-70">الدور</th>
                <th className="px-4 py-3 font-bold opacity-70">الحالة</th>
                <th className="px-4 py-3 font-bold opacity-70">الصلاحيات</th>
                <th className="px-4 py-3 font-bold opacity-70 text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass-border/20">
              {staff.map((member) => (
                <tr key={member.id} className="hover:bg-white/30 dark:hover:bg-black/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {member.full_name.charAt(0)}
                      </div>
                      <span className="font-semibold">{member.full_name}</span>
                      {member.id === currentUserId && (
                        <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded-full">أنت</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 opacity-70 font-mono text-xs">—</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-white/60 dark:bg-black/40 px-2 py-1 rounded-full border border-glass-border/30">
                      {roleLabels[member.role] ?? member.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-full border w-fit", member.is_active ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-red-500/10 text-red-600 border-red-500/20")}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", member.is_active ? "bg-green-500" : "bg-red-500")} />
                      {member.is_active ? "نشط" : "موقوف"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs opacity-60">
                      {member.user_permissions.length} صلاحية
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {member.id === currentUserId ? (
                      <span className="text-xs opacity-40 block text-center">—</span>
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          title="تعديل البيانات والصلاحيات"
                          className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                          onClick={() => setEditing(member)}
                          disabled={busy.startsWith(member.id)}
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          title={member.is_active ? "إيقاف الحساب" : "تفعيل الحساب"}
                          className={cn("p-2 rounded-lg transition-colors", member.is_active ? "hover:bg-amber-500/10 text-amber-600" : "hover:bg-green-500/10 text-green-600")}
                          onClick={() => void action(member.id, "status")}
                          disabled={busy.startsWith(member.id)}
                        >
                          <PowerOff size={15} />
                        </button>
                        <button
                          title="تغيير كلمة المرور"
                          className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-500 transition-colors"
                          onClick={() => setPasswordTarget(member)}
                          disabled={busy.startsWith(member.id)}
                        >
                          <KeyRound size={15} />
                        </button>
                        <button
                          title="حذف الحساب نهائياً"
                          className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                          onClick={() => {
                            if (window.confirm(`هل أنت متأكد من حذف حساب ${member.full_name} نهائياً؟`)) {
                              void action(member.id, "delete");
                            }
                          }}
                          disabled={busy.startsWith(member.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <AnimatePresence>
        {editing && <EditModal member={editing} permissions={permissions} onClose={() => setEditing(null)} onSave={(payload) => action(editing.id, "update", payload)} />}
        {passwordTarget && <PasswordModal member={passwordTarget} onClose={() => setPasswordTarget(null)} onSave={(password) => action(passwordTarget.id, "password", { password })} />}
      </AnimatePresence>
    </>
  );
}

function PermissionGroups({ permissions, defaultSelected, isReadOnly = false }: { permissions: Permission[]; defaultSelected: string[]; isReadOnly?: boolean }) {
  const [openSection, setOpenSection] = useState<string | null>(groups[0].title);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(defaultSelected);

  useMemo(() => { setSelectedKeys(defaultSelected); }, [defaultSelected]);

  const toggleAll = (keys: { key: string }[]) => {
    const allIncluded = keys.every(k => selectedKeys.includes(k.key));
    if (allIncluded) setSelectedKeys(current => current.filter(k => !keys.map(x => x.key).includes(k)));
    else setSelectedKeys(current => Array.from(new Set([...current, ...keys.map(x => x.key)])));
  };

  const toggleSingle = (key: string, checked: boolean) => {
    if (checked) setSelectedKeys(current => Array.from(new Set([...current, key])));
    else setSelectedKeys(current => current.filter(k => k !== key));
  };

  return (
    <div className="flex flex-col gap-2">
      {groups.map(({ title, icon: Icon, color, bg, keys }) => (
        <div key={title} className="bg-white/40 dark:bg-white/5 border border-glass-border/40 overflow-hidden rounded-xl">
          <button
            type="button"
            className="w-full flex items-center justify-between p-3.5 hover:bg-white/20 dark:hover:bg-white/5 transition-colors"
            onClick={() => setOpenSection(openSection === title ? null : title)}
          >
            <div className="flex items-center gap-3">
              <span className={cn("p-1.5 rounded-lg", bg, color)}><Icon size={16} /></span>
              <span className="font-bold text-sm">{title}</span>
              <span className="text-xs opacity-50">({keys.filter(k => selectedKeys.includes(k.key)).length}/{keys.length})</span>
            </div>
            <motion.div animate={{ rotate: openSection === title ? 180 : 0 }} transition={{ duration: 0.25 }}>
              <ChevronDown size={16} className="opacity-60" />
            </motion.div>
          </button>

          <AnimatePresence>
            {openSection === title && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="border-t border-glass-border/20"
              >
                {!isReadOnly && (
                  <div className="px-4 py-2 bg-white/30 dark:bg-black/20 flex justify-end border-b border-glass-border/10">
                    <button type="button" onClick={() => toggleAll(keys)} className="text-xs bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-lg hover:bg-primary/30 transition-colors">
                      تفعيل كل صلاحيات القسم
                    </button>
                  </div>
                )}
                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white/20 dark:bg-black/10">
                  {keys.map(({ key, label }) => (
                    <label key={key} className={cn("flex flex-row-reverse items-center justify-between bg-white/50 dark:bg-black/40 border border-glass-border/30 p-2.5 rounded-lg shadow-sm transition-colors", isReadOnly ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-white/70 dark:hover:bg-black/60")}>
                      <div className="relative w-10 h-5 flex shrink-0">
                        <input type="checkbox" name={key} className="peer sr-only" checked={selectedKeys.includes(key)} onChange={(e) => !isReadOnly && toggleSingle(key, e.target.checked)} disabled={isReadOnly} />
                        <div className="absolute inset-0 rounded-full bg-slate-300 dark:bg-slate-700 peer-checked:bg-primary transition-colors duration-300" />
                        <motion.div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow z-10" layout animate={{ x: selectedKeys.includes(key) ? -20 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
                      </div>
                      <span className="text-xs font-semibold opacity-90">{label}</span>
                    </label>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

function EditModal({ member, permissions, onClose, onSave }: { member: StaffMember; permissions: Permission[]; onClose: () => void; onSave: (payload: Record<string, unknown>) => void }) {
  return (
    <Modal title={`تعديل بيانات ${member.full_name}`} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); const form = new FormData(e.currentTarget); onSave({ fullName: form.get("fullName"), role: form.get("role"), permissions: permissions.map(p => p.key).filter(k => form.get(k) === "on") }); }} className="flex flex-col gap-4 mt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">الاسم</label>
            <input name="fullName" className="glass-input h-11" defaultValue={member.full_name} required />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">الدور الوظيفي</label>
            <select name="role" className="glass-input h-11" defaultValue={member.role}>
              <option value="manager" className="text-black">مدير</option>
              <option value="editor" className="text-black">محرر</option>
              <option value="advertiser" className="text-black">مسؤول إعلانات</option>
            </select>
          </div>
        </div>
        <div>
          <h4 className="font-bold mb-3 text-sm">الصلاحيات المُسندة</h4>
          <PermissionGroups permissions={permissions} defaultSelected={member.user_permissions.map(p => p.permission_key)} />
        </div>
        <div className="flex items-center gap-3 justify-end mt-4 pt-4 border-t border-glass-border/30">
          <button className="glass-button glass-button-secondary" type="button" onClick={onClose}><X size={16} /> إلغاء</button>
          <button className="glass-button glass-button-primary" type="submit"><Check size={16} /> حفظ التعديلات</button>
        </div>
      </form>
    </Modal>
  );
}

function PasswordModal({ member, onClose, onSave }: { member: StaffMember; onClose: () => void; onSave: (password: string) => void }) {
  return (
    <Modal title={`تغيير كلمة مرور ${member.full_name}`} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); const v = new FormData(e.currentTarget).get("password"); if (typeof v === "string") onSave(v); }} className="flex flex-col gap-4 mt-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold">كلمة المرور الجديدة</label>
          <input name="password" type="password" className="glass-input h-11" minLength={8} autoFocus required placeholder="8 حروف على الأقل" dir="ltr" />
        </div>
        <div className="flex items-center gap-3 justify-end mt-4 pt-4 border-t border-glass-border/30">
          <button className="glass-button glass-button-secondary" type="button" onClick={onClose}><X size={16} /> إلغاء</button>
          <button className="glass-button glass-button-primary" type="submit"><KeyRound size={16} /> تغيير وتحديث</button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.section
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", duration: 0.4 }}
        className="glass-panel w-full max-w-[640px] max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative"
        role="dialog" aria-modal="true"
      >
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button className="p-2 rounded-full hover:bg-red-500/10 hover:text-red-500 transition-colors" type="button" aria-label="إغلاق" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        {children}
      </motion.section>
    </motion.div>
  );
}
