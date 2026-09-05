"use client";

import { Camera, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

type Profile = { full_name: string | null; phone: string | null; avatar_url: string | null; bio: string | null; facebook: string | null; x_twitter: string | null; whatsapp: string | null };

export default function ProfilePage() {
  const [email, setEmail] = useState(""); const [phone, setPhone] = useState("");
  const [profile, setProfile] = useState<Profile>({ full_name: null, phone: null, avatar_url: null, bio: null, facebook: null, x_twitter: null, whatsapp: null });
  const [password, setPassword] = useState(""); const [saved, setSaved] = useState(false);
  const [error, setError] = useState(""); const [message, setMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user) return;
      setUserId(user.id); setEmail(user.email ?? "");
      const result = await supabase.from("profiles").select("full_name,phone,avatar_url,bio,facebook,x_twitter,whatsapp").eq("user_id", user.id).maybeSingle();
      if (result.data) { setProfile(result.data as Profile); setPhone((result.data as Profile).phone ?? ""); }
      else await supabase.from("profiles").insert({ user_id: user.id, full_name: user.email?.split("@")[0] ?? "" });
    });
  }, []);

  async function save() {
    if (!userId) return;
    setError(""); setMessage("");
    const supabase = createClient();
    const updateResult = await supabase.from("profiles").update({ ...profile, updated_at: new Date().toISOString() }).eq("user_id", userId);
    if (updateResult.error) { setError(updateResult.error.message); return; }
    if (password) {
      if (password.length < 6) { setError("كلمة السر لازم تكون 6 حروف على الأقل"); return; }
      const { error } = await createClient().auth.updateUser({ password });
      if (error) { setError(error.message); return; }
      setPassword(""); setMessage("تم حفظ البيانات وتغيير كلمة المرور");
    } else setMessage("تم حفظ البيانات");
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  async function uploadAvatar(file: File) {
    if (!userId) return;
    const path = `avatars/${userId}-${Date.now()}.jpg`;
    const supabase = createClient();
    const { error } = await supabase.storage.from("news-media").upload(path, file, { contentType: file.type, upsert: true });
    if (error) { setError("تعذر رفع الصورة: " + error.message); return; }
    const url = supabase.storage.from("news-media").getPublicUrl(path).data.publicUrl;
    setProfile(current => ({ ...current, avatar_url: url }));
  }

  const field = (label: string, key: keyof Profile, placeholder = "") => <label className="text-sm font-semibold">{label}<input value={profile[key] ?? ""} onChange={event => setProfile(current => ({ ...current, [key]: event.target.value }))} className="admin-input mt-1.5" placeholder={placeholder} /></label>;

  return <main className="min-h-screen flex-1 bg-background p-4 text-foreground sm:p-8"><div className="mx-auto max-w-3xl"><h1 className="mb-6 text-2xl font-black">حسابي</h1>{message && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">{message}</p>}{error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>}<section className="rounded-xl border bg-card p-4 shadow-sm sm:p-6"><div className="mb-6 flex items-center gap-4">{profile.avatar_url ? <img src={profile.avatar_url} alt="صورتك" className="size-16 rounded-full object-cover" /> : <div className="grid size-16 place-items-center rounded-full bg-accent text-primary"><Camera size={22} /></div>}<label className="interactive-button cursor-pointer text-sm font-semibold text-primary">تغيير الصورة<input type="file" accept="image/*" className="hidden" onChange={event => { const file = event.target.files?.[0]; if (file) uploadAvatar(file); }} /></label></div><div className="grid gap-4 sm:grid-cols-2">{field("الاسم", "full_name", "اسمك الكامل")}<label className="text-sm font-semibold">البريد الإلكتروني<input className="admin-input mt-1.5 opacity-60" disabled value={email} dir="ltr" /></label><label className="text-sm font-semibold">رقم الموبايل<input className="admin-input mt-1.5 opacity-60" disabled value={phone || "غير مسجل"} dir="ltr" /></label><label className="text-sm font-semibold">النبذة<input value={profile.bio ?? ""} onChange={event => setProfile(current => ({ ...current, bio: event.target.value }))} className="admin-input mt-1.5" placeholder="نبذة قصيرة عنك" /></label>{field("فيسبوك", "facebook", "https://facebook.com/...")}{field("تويتر / X", "x_twitter", "https://x.com/...")}{field("واتساب", "whatsapp", "https://wa.me/...")}<label className="text-sm font-semibold">كلمة مرور جديدة<input type="password" value={password} onChange={event => setPassword(event.target.value)} className="admin-input mt-1.5" placeholder="اتركها فارغة بدون تغيير" autoComplete="new-password" /></label></div><button onClick={save} className="interactive-button mt-6 flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"><Save size={16} />{saved ? "تم الحفظ" : "حفظ التغييرات"}</button></section></div></main>;
}
