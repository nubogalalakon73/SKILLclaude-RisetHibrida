import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { WhatsappLogo, Robot, X, CaretDown, CheckCircle, WarningCircle, Star } from '@phosphor-icons/react';
import { Toaster, toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// --- SHADCN-LIKE UI COMPONENTS ---
const Button = React.forwardRef(({ className = "", variant = "primary", size = "default", ...props }, ref) => {
  const baseStyle = "inline-flex items-center justify-center rounded-md font-medium transition-all focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none hover:-translate-y-1";
  const variants = {
    primary: "bg-gold text-white hover:bg-gold-light",
    navy: "bg-navy text-white hover:bg-navy-light",
    outline: "border border-slate-300 bg-transparent hover:bg-slate-50 text-navy",
    ghost: "bg-transparent hover:bg-slate-100 text-navy"
  };
  const sizes = {
    default: "h-10 py-2 px-4",
    sm: "h-9 px-3 rounded-md",
    lg: "h-12 px-8 rounded-md text-lg"
  };
  
  return (
    <button
      ref={ref}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
});

const Input = React.forwardRef(({ className = "", ...props }, ref) => (
  <input
    ref={ref}
    className={`flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
));

const Label = React.forwardRef(({ className = "", ...props }, ref) => (
  <label
    ref={ref}
    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
    {...props}
  />
));

const Dialog = ({ open, onOpenChange, children }) => (
  <AnimatePresence>
    {open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onOpenChange(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="z-50 w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
        >
          {children}
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// --- SECTIONS ---

const HeroSection = () => {
  const [slots, setSlots] = useState(200);

  useEffect(() => {
    fetch(`${API_URL}/api/slots`)
      .then(r => r.json())
      .then(d => setSlots(d.remaining))
      .catch(() => {});
  }, []);

  return (
    <section className="relative bg-navy text-white pt-20 pb-32 clip-diagonal overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center space-x-2 bg-red-600/20 border border-red-500/30 rounded-full px-4 py-1.5 text-sm text-red-200">
            <span className="text-xl">🔥</span>
            <span>PROMO TERBATAS — Sisa {slots} slot Master Bundle (Webinar + Sertifikat)</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-display font-bold leading-tight tracking-tighter text-white">
            SKILL Claude: <span className="text-gold">Riset Hibrida</span>
          </h1>
          
          <p className="text-xl text-slate-300 font-body">
            35 Prompt & Panduan iRDR untuk Skripsi, Tesis, Disertasi, dan Artikel Jurnal
          </p>
          
          <div className="text-lg font-medium text-slate-400">
            "Manusia Tetap Nakhoda. AI adalah Radarnya."
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button size="lg" variant="primary" onClick={() => document.getElementById('pricing').scrollIntoView({behavior: 'smooth'})} data-testid="hero-primary-btn">
              Pilih Paket Saya →
            </Button>
            <Button size="lg" variant="outline" className="text-white border-slate-600 hover:bg-slate-800" onClick={() => document.getElementById('features').scrollIntoView({behavior: 'smooth'})} data-testid="hero-secondary-btn">
              Lihat Isi Bundle
            </Button>
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-400 pt-4">
            <div className="flex items-center gap-1"><CheckCircle weight="fill" className="text-whatsapp"/> Diterbitkan ITB Press</div>
            <div className="flex items-center gap-1"><CheckCircle weight="fill" className="text-whatsapp"/> 1.000+ Pembaca</div>
            <div className="flex items-center gap-1"><CheckCircle weight="fill" className="text-whatsapp"/> SPAK & BKD</div>
          </div>
        </div>

        <div className="relative">
          <motion.img 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            src="https://customer-assets.emergentagent.com/job_31dea077-4193-4875-aa87-5e1c31174f93/artifacts/9hudhv8w_COVER.png" 
            alt="Skill Claude Book Cover" 
            className="rounded-2xl shadow-2xl shadow-gold/20 w-full max-w-md mx-auto"
          />
        </div>
      </div>
    </section>
  );
};

const ProblemSection = () => (
  <section className="py-20 bg-slate-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-navy mb-4">
          Kenapa Beli Ebook Prompt Sakti Tidak Cukup?
        </h2>
        <p className="text-lg text-slate-600 max-w-3xl mx-auto">
          Framework iRDR bukan kumpulan prompt. Ini adalah protokol kolaborasi manusia-AI yang memastikan setiap output bisa Anda pertanggungjawabkan di sidang.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {[
          { icon: "🧟‍♂️", title: "Zombie Text", desc: "Output AI yang panjang tapi tidak berjiwa. Revisi tanpa akhir." },
          { icon: "🎭", title: "Halusinasi Referensi", desc: "AI mengarang jurnal yang tidak ada. Malu di depan penguji." },
          { icon: "❌", title: "Tanpa Metodologi", desc: "Cepat menghasilkan teks, tapi tidak bisa dipertanggungjawabkan secara akademik." }
        ].map((item, i) => (
          <div key={i} className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center hover:-translate-y-2 transition-transform duration-300">
            <div className="text-5xl mb-4">{item.icon}</div>
            <h3 className="text-xl font-bold text-navy mb-2">{item.title}</h3>
            <p className="text-slate-600">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const IRDRSection = () => (
  <section className="py-20 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="text-3xl md:text-4xl font-display font-bold text-navy text-center mb-16">
        Proses Framework iRDR
      </h2>
      <div className="flex overflow-x-auto md:grid md:grid-cols-4 gap-6 pb-8 snap-x">
        {[
          { icon: "🔵", name: "INJECT", desc: "Mengunci paradigma & rumusan masalah. Fondasi riset yang tidak bisa digoyang." },
          { icon: "🟢", name: "RAPID", desc: "Eksplorasi literatur massal. Peta diskursus ilmiah dalam hitungan menit." },
          { icon: "🔴", name: "DIAGNOSE", desc: "Membunuh zombie text & halusinasi. Audit integritas sebelum terlambat." },
          { icon: "🟡", name: "REFINE", desc: "Menghaluskan narasi akademik. Suara peneliti tetap terdengar." }
        ].map((phase, i) => (
          <div key={i} className="min-w-[280px] bg-slate-50 p-6 rounded-xl border border-slate-100 snap-center">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{phase.icon}</span>
              <h3 className="text-xl font-bold tracking-widest text-navy">{phase.name}</h3>
            </div>
            <p className="text-slate-600">{phase.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const PricingSection = ({ onSelectPlan }) => {
  return (
    <section id="pricing" className="py-24 bg-navy relative clip-diagonal">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-white text-center mb-4">
          Pilih Paket yang Sesuai Kebutuhan Anda
        </h2>
        <p className="text-slate-400 text-center mb-16">Semua paket: Akses langsung setelah pembayaran sukses | Format digital</p>

        <div className="grid md:grid-cols-3 gap-8 items-center">
          {/* STARTER */}
          <div className="bg-white rounded-2xl p-8 shadow-xl">
            <h3 className="text-2xl font-bold text-navy mb-2">Prompt Pack</h3>
            <div className="text-3xl font-display font-bold text-gold mb-2">Rp 79.000</div>
            <p className="text-slate-500 text-sm mb-6">Mahasiswa S1 yang baru mulai</p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-2"><CheckCircle className="text-whatsapp"/> 35 Prompt Siap Pakai</li>
              <li className="flex items-center gap-2"><CheckCircle className="text-whatsapp"/> Panduan Penggunaan 1 Halaman</li>
              <li className="flex items-center gap-2 text-slate-400"><X className="text-red-400"/> Skill File untuk Claude</li>
              <li className="flex items-center gap-2 text-slate-400"><X className="text-red-400"/> Template Dokumen</li>
            </ul>
            <Button className="w-full" variant="outline" onClick={() => onSelectPlan('starter', 79000, 'Prompt Pack')} data-testid="buy-starter">
              Beli Prompt Pack →
            </Button>
          </div>

          {/* SKILL PACK - FEATURED */}
          <div className="bg-white rounded-2xl p-8 shadow-2xl shadow-gold/20 border-2 border-gold transform md:-translate-y-4 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white px-4 py-1 rounded-full text-sm font-bold tracking-wider">
              🔥 PALING LAKU
            </div>
            <h3 className="text-2xl font-bold text-navy mb-2">Riset Hibrida Skill</h3>
            <div className="text-4xl font-display font-bold text-navy mb-2">Rp 199.000</div>
            <p className="text-slate-500 text-sm mb-6">Mahasiswa S2/S3 & Dosen</p>
            <ul className="space-y-4 mb-8 font-medium">
              <li className="flex items-center gap-2"><CheckCircle className="text-whatsapp"/> Semua isi Starter Pack</li>
              <li className="flex items-center gap-2"><CheckCircle className="text-whatsapp"/> SKILL File untuk Claude</li>
              <li className="flex items-center gap-2"><CheckCircle className="text-whatsapp"/> Panduan Instalasi</li>
              <li className="flex items-center gap-2"><CheckCircle className="text-whatsapp"/> Template Research Blueprint</li>
              <li className="flex items-center gap-2"><CheckCircle className="text-whatsapp"/> Template Synthesis Matrix</li>
            </ul>
            <Button className="w-full" variant="primary" onClick={() => onSelectPlan('skill', 199000, 'Riset Hibrida Skill')} data-testid="buy-skill">
              Beli Skill Pack →
            </Button>
          </div>

          {/* MASTER */}
          <div className="bg-white rounded-2xl p-8 shadow-xl">
            <h3 className="text-2xl font-bold text-navy mb-2">Master Bundle 🏆</h3>
            <div className="text-3xl font-display font-bold text-gold mb-2">Rp 399.000</div>
            <p className="text-slate-500 text-sm mb-6">Komplit + Webinar Eksklusif</p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-2"><CheckCircle className="text-whatsapp"/> Semua isi Skill Pack</li>
              <li className="flex items-center gap-2"><CheckCircle className="text-whatsapp"/> Buku Digital Riset Hibrida 2.0</li>
              <li className="flex items-center gap-2"><CheckCircle className="text-whatsapp"/> Protokol Riset Hibrida 2.1</li>
              <li className="flex items-center gap-2"><CheckCircle className="text-whatsapp"/> Rekaman Video Webinar</li>
              <li className="flex items-start gap-2 bg-slate-50 p-2 rounded text-sm text-navy font-medium border border-gold/30">
                <span>🎁</span>
                <span>BONUS 200 Pembeli Pertama: Undangan Webinar & Sertifikat SPAK/BKD</span>
              </li>
            </ul>
            <Button className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={() => onSelectPlan('master', 399000, 'Master Bundle')} data-testid="buy-master">
              Klaim Master Bundle →
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

const CheckoutModal = ({ open, setOpen, selectedPlan }) => {
  const navigate = useNavigate();
  const schema = z.object({
const FeaturesSection = () => (
  <section id="features" className="py-20 bg-slate-50 border-t border-slate-200">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="text-3xl md:text-4xl font-display font-bold text-navy text-center mb-16">
        Apa yang Ada di Dalam Bundle
      </h2>
      <div className="grid md:grid-cols-4 gap-6">
        {[
          { title: "Framework iRDR", desc: "Peta kolaborasi manusia-AI yang terstruktur" },
          { title: "Teknik R.A.G.", desc: "AI menjawab berbasis data nyata, bukan halusinasi" },
          { title: "Sensory Grounding", desc: "Turun ke lapangan sebelum bertanya ke AI" },
          { title: "Triangulasi Data", desc: "Validasi dari tiga arah" },
          { title: "De-zombifikasi", desc: "Menghidupkan kembali teks tanpa jiwa" },
          { title: "Dignity Check", desc: "Lima pertanyaan sebelum tanda tangan" },
          { title: "Studi Kasus", desc: "Ahmad, Rina, Budi — tiga jalur berbeda" },
          { title: "35 Prompt Siap Pakai", desc: "Terstruktur per fase iRDR" }
        ].map((feat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-bold text-navy mb-2">{feat.title}</h3>
            <p className="text-sm text-slate-600">{feat.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const TestimonialsSection = () => (
  <section className="py-20 bg-navy text-white clip-diagonal">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-16">Apa Kata Mereka?</h2>
      <div className="grid md:grid-cols-3 gap-8">
        {[
          {
            quote: "Buku ini memberi perspektif baru tentang bagaimana AI dapat digunakan secara cerdas dalam penelitian. Bukan sekadar cepat, tetapi tetap menjaga kualitas dan integritas akademik.",
            author: "Dr. Rina Kurniasih, Dosen & Peneliti"
          },
          {
            quote: "Bahasanya jelas, aplikatif, dan langsung bisa dipraktikkan. Saya jadi lebih paham bagaimana memanfaatkan AI untuk menyusun proposal, analisis data, hingga penulisan tesis.",
            author: "Andi Pratama, Mahasiswa Pascasarjana"
          },
          {
            quote: "Referensi yang relevan untuk kampus masa kini. Buku ini menjembatani kebutuhan akademik tradisional dengan transformasi digital yang sedang berlangsung.",
            author: "Prof. Budi Santoso, Akademisi & Reviewer Jurnal"
          }
        ].map((t, i) => (
          <div key={i} className="bg-navy-light p-8 rounded-2xl border border-slate-700">
            <div className="flex gap-1 mb-4 text-gold">
              {[...Array(5)].map((_, idx) => <Star key={idx} weight="fill" />)}
            </div>
            <p className="italic text-slate-300 mb-6">"{t.quote}"</p>
            <div className="font-bold text-white">— {t.author}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const WebinarPromo = () => (
  <section className="py-12 bg-gold/10 border-y border-gold/20">
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-8 items-center">
      <div>
        <div className="text-gold font-bold mb-2">🎓 Bonus Eksklusif — 200 Pembeli Pertama</div>
        <h2 className="text-3xl font-display font-bold text-navy mb-4">MASTER BUNDLE EARLY BIRD BENEFIT</h2>
        <ul className="space-y-4 mb-6">
          <li className="flex gap-3">
            <span className="text-xl">📅</span>
            <div>
              <div className="font-bold text-navy">Undangan Eksklusif ke Webinar Riset Hibrida</div>
              <div className="text-sm text-slate-600">Akses langsung ke sesi tanya jawab dengan Penulis.</div>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="text-xl">🏅</span>
            <div>
              <div className="font-bold text-navy">Sertifikat Penunjang Resmi</div>
              <div className="text-sm text-slate-600">✓ SPAK (Mahasiswa) ✓ BKD (Dosen)</div>
            </div>
          </li>
        </ul>
        <Button onClick={() => document.getElementById('pricing').scrollIntoView({behavior: 'smooth'})} className="bg-navy hover:bg-navy-light w-full sm:w-auto" data-testid="promo-btn">
          Klaim Slot Saya Sebelum Habis →
        </Button>
      </div>
      <div>
        <img src="https://static.prod-images.emergentagent.com/jobs/31dea077-4193-4875-aa87-5e1c31174f93/images/487f0c904467e55b4f1483e6ff5010638ad97393b9af161f6925a5dd7e34c2e3.png" alt="Sertifikat Mockup" className="rounded-2xl shadow-xl w-full" />
      </div>
    </div>
  </section>
);

const FAQSection = () => {
  const faqs = [
    { q: "Apa perbedaan Skill Pack dan Master Bundle?", a: "Skill Pack berisi semua tools untuk mulai (SKILL file, 35 prompt, template). Master Bundle menambahkan dua buku digital, prompt khusus per disiplin ilmu, rekaman webinar, dan update seumur hidup + bonus eksklusif 200 pembeli pertama." },
    { q: "Apakah saya perlu berlangganan Claude Pro?", a: "Tidak wajib. Claude versi gratis sudah bisa menggunakan SKILL file di Projects. Namun Claude Pro memberikan lebih banyak pesan per hari." },
    { q: "Bagaimana cara menginstal SKILL file ke Claude?", a: "Mudah — buka claude.ai, buat Project baru, paste isi SKILL file ke 'Project instructions'. Panduan instalasi sudah ada di dalam paket." },
    { q: "Bagaimana cara mendapat link download setelah bayar?", a: "Otomatis — link download dikirim ke email Anda dalam 5 menit setelah pembayaran terkonfirmasi. Cek folder spam jika tidak menerima." }
  ];
  return (
    <section className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-3xl font-display font-bold text-navy text-center mb-10">Tanya Jawab (FAQ)</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <details key={i} className="group bg-slate-50 rounded-lg border border-slate-200">
              <summary className="flex justify-between items-center font-medium cursor-pointer list-none p-4 text-navy">
                <span>{faq.q}</span>
                <span className="transition group-open:rotate-180">
                  <CaretDown />
                </span>
              </summary>
              <div className="text-slate-600 mt-3 group-open:animate-fadeIn p-4 pt-0">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};
    name: z.string().min(2, "Nama wajib diisi"),
    email: z.string().email("Email tidak valid"),
    phone: z.string().min(9, "No HP wajib diisi"),
    institution: z.string().optional(),
    job: z.string().min(2, "Pekerjaan wajib diisi")
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (data) => {
    try {
      const res = await fetch(`${API_URL}/api/create-payment`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          product: selectedPlan.id,
          amount: selectedPlan.price,
          customer: data
        })
      });
      const result = await res.json();
      if(result.paymentUrl) {
        window.location.href = result.paymentUrl;
      }
    } catch(err) {
      toast.error("Gagal membuat pembayaran. Coba lagi.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-display font-bold">Detail Pesanan</h3>
        <button onClick={() => setOpen(false)} data-testid="close-modal"><X size={24}/></button>
      </div>
      
      <div className="bg-slate-50 p-4 rounded-lg mb-6 flex justify-between items-center">
        <div>
          <div className="font-bold text-navy">{selectedPlan?.name}</div>
          <div className="text-sm text-slate-500">Akses Digital Selamanya</div>
        </div>
        <div className="font-bold text-gold">Rp {selectedPlan?.price?.toLocaleString('id-ID')}</div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label>Nama Lengkap *</Label>
          <Input {...register('name')} placeholder="Budi Santoso" data-testid="input-name"/>
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <Label>Email * (Untuk Link Download)</Label>
          <Input {...register('email')} type="email" placeholder="budi@example.com" data-testid="input-email"/>
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <Label>Nomor WhatsApp *</Label>
          <Input {...register('phone')} type="tel" placeholder="0812345678" data-testid="input-phone"/>
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
        </div>
        <div>
          <Label>Pekerjaan *</Label>
          <select {...register('job')} className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:ring-2 focus:ring-navy focus:border-transparent" data-testid="input-job">
            <option value="">Pilih...</option>
            <option value="Mahasiswa S1">Mahasiswa S1</option>
            <option value="Mahasiswa S2">Mahasiswa S2</option>
            <option value="Mahasiswa S3">Mahasiswa S3</option>
            <option value="Dosen">Dosen</option>
            <option value="Peneliti">Peneliti</option>
            <option value="Lainnya">Lainnya</option>
          </select>
          {errors.job && <p className="text-red-500 text-sm mt-1">{errors.job.message}</p>}
        </div>
        <div>
          <Label>Institusi (Opsional)</Label>
          <Input {...register('institution')} placeholder="Universitas..." data-testid="input-inst"/>
        </div>
        
        <p className="text-xs text-slate-500 pt-4">Dengan memesan, Anda setuju dengan syarat & ketentuan</p>
        <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting} data-testid="submit-checkout">
          {isSubmitting ? "Memproses..." : "Lanjut ke Pembayaran →"}
        </Button>
      </form>
    </Dialog>
  );
};

const ChatbotWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'model', content: 'Halo! Saya Asisten Riset Hibrida. Ada yang bisa saya bantu terkait produk atau metodologi riset?' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if(scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = async (text) => {
    if(!text.trim()) return;
    const newMsgs = [...messages, { role: 'user', content: text }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);
    
    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ messages: newMsgs })
      });
      const data = await res.json();
      setMessages([...newMsgs, { role: 'model', content: data.reply }]);
    } catch(e) {
      setMessages([...newMsgs, { role: 'model', content: "Koneksi terputus. Silakan coba lagi." }]);
    }
    setLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-16 right-0 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-96"
          >
            <div className="bg-navy text-white p-4 font-bold flex justify-between items-center">
              <div className="flex items-center gap-2"><Robot size={24}/> Tanya Asisten</div>
              <button onClick={() => setOpen(false)} data-testid="close-chat"><X size={20}/></button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-4" ref={scrollRef}>
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg text-sm ${m.role === 'user' ? 'bg-gold text-white rounded-br-none' : 'bg-white border border-slate-200 text-navy rounded-bl-none'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && <div className="text-slate-400 text-xs animate-pulse">Mengetik...</div>}
            </div>
            <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
              <Input 
                value={input} 
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send(input)}
                placeholder="Tulis pesan..."
                data-testid="chat-input"
              />
              <Button onClick={() => send(input)} data-testid="chat-send">Kirim</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setOpen(!open)} 
        className="w-14 h-14 bg-gold text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
        data-testid="toggle-chat"
        aria-label="Chat dengan AI"
      >
        <Robot size={32} />
      </button>
    </div>
  );
};

const WhatsAppWidget = () => (
  <a 
    href="https://wa.me/6289985533300?text=Halo%2C%20saya%20ingin%20konsultasi%20riset%20dan%20jurnal%20dari%20website%20Skill%20Claude%20Riset%20Hibrida"
    target="_blank" rel="noopener noreferrer"
    className="fixed bottom-6 left-6 z-40 bg-whatsapp text-white px-4 py-3 rounded-full flex items-center gap-3 shadow-xl hover:scale-105 transition-transform"
    data-testid="wa-widget"
    aria-label="Chat WhatsApp"
  >
    <WhatsappLogo size={28} weight="fill" />
    <div className="hidden sm:block">
      <div className="text-sm font-bold leading-tight">Konsultasi Riset</div>
      <div className="text-xs opacity-90">Chat langsung tim kami</div>
    </div>
  </a>
);

// --- PAGES ---

const LandingPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const openCheckout = (id, price, name) => {
    setSelectedPlan({ id, price, name });
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen relative font-body selection:bg-gold selection:text-white">
      <HeroSection />
      <ProblemSection />
      <IRDRSection />
      <FeaturesSection />
      <PricingSection onSelectPlan={openCheckout} />
      <WebinarPromo />
      
      {/* Secondary Books Section */}
      <section className="py-16 bg-slate-100">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-navy mb-8">Lebih Suka Buku Fisik?</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <img src="https://risethibrida.com/wp-content/uploads/2026/04/buatkan_mockup_background_202604140021-1024x572.jpeg" alt="Buku 1" className="w-full h-48 object-cover rounded-lg mb-4"/>
              <h4 className="font-bold text-lg mb-2">Riset Hibrida 2.0</h4>
              <p className="text-slate-500 mb-4 text-sm">Rp 170.000 | 218 hal | ITB Press</p>
              <Button variant="outline" className="w-full" onClick={()=>window.open('https://whatsform.com/kcnwtj')} data-testid="buy-book-1">Pesan via WhatsApp</Button>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <img src="https://risethibrida.com/wp-content/uploads/2026/04/buatkan_mockup_background_202604140023-1024x572.jpeg" alt="Buku 2" className="w-full h-48 object-cover rounded-lg mb-4"/>
              <h4 className="font-bold text-lg mb-2">Protokol Riset Hibrida 2.1</h4>
              <p className="text-slate-500 mb-4 text-sm">Rp 170.000 | 156 hal | ITB Press</p>
              <Button variant="outline" className="w-full" onClick={()=>window.open('https://whatsform.com/kcnwtj')} data-testid="buy-book-2">Pesan via WhatsApp</Button>
            </div>
          </div>
        </div>
      </section>

      <TestimonialsSection />
      <FAQSection />

      <CheckoutModal open={modalOpen} setOpen={setModalOpen} selectedPlan={selectedPlan} />
      <ChatbotWidget />
      <WhatsAppWidget />
      
      <footer className="bg-navy-light text-slate-400 py-12 text-center text-sm">
        <div className="flex justify-center mb-6">
          <img src="https://risethibrida.com/wp-content/uploads/2026/04/cropped-itbpress-color.png" alt="ITB Press" className="h-12 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all"/>
        </div>
        <p className="mb-4 text-white font-medium">Manusia Tetap Nakhoda. AI adalah Radarnya.</p>
        <p className="mb-4">© 2026 Riset Hibrida | ITB Press. All rights reserved.</p>
        <p>Email: risethibrida@gmail.com | WA: 085322555333</p>
      </footer>
    </div>
  );
};

const MockPaymentPage = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  const navigate = useNavigate();

  const handlePay = async () => {
    // Simulate Duitku Callback
    await fetch(`${API_URL}/api/payment-callback`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ merchantOrderId: orderId, resultCode: "00" })
    });
    navigate('/payment-success');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-xl max-w-sm w-full text-center">
        <h2 className="text-2xl font-bold mb-4">Mock Duitku Payment</h2>
        <p className="mb-2">Order ID: {orderId}</p>
        <p className="text-xl font-bold text-navy mb-8">Amount: Rp {Number(amount).toLocaleString('id-ID')}</p>
        <Button className="w-full mb-4" variant="primary" onClick={handlePay} data-testid="mock-pay-btn">Simulate Successful Payment</Button>
        <Button className="w-full" variant="outline" onClick={() => navigate('/')}>Cancel Payment</Button>
      </div>
    </div>
  );
}

const PaymentSuccessPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-navy p-4 text-white">
      <div className="bg-white text-navy p-10 rounded-2xl shadow-2xl max-w-md w-full text-center">
        <CheckCircle size={64} className="text-whatsapp mx-auto mb-6" weight="fill" />
        <h2 className="text-3xl font-display font-bold mb-2">Pembayaran Berhasil!</h2>
        <p className="text-slate-600 mb-6">Terima kasih! Link download telah dikirim ke email Anda. Cek folder spam jika tidak menerima dalam 5 menit.</p>
        <Button className="w-full" variant="primary" onClick={() => window.location.href='/'} data-testid="success-home-btn">Kembali ke Beranda</Button>
      </div>
    </div>
  );
}

const DownloadPage = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    fetch(`${API_URL}/api/download/${token}`)
      .then(res => {
        if(res.ok) setStatus('success');
        else setStatus('error');
      })
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md w-full text-center">
        {status === 'loading' && <p>Validating token...</p>}
        {status === 'success' && (
          <>
            <CheckCircle size={64} className="text-whatsapp mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Download Siap</h2>
            <Button className="w-full" onClick={() => toast.success("Mendownload file...")} data-testid="download-btn">Unduh File Anda</Button>
          </>
        )}
        {status === 'error' && (
          <>
            <WarningCircle size={64} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Token Tidak Valid / Expired</h2>
            <p className="text-slate-500">Silakan hubungi admin.</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Toaster position="top-center" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/mock-payment" element={<MockPaymentPage />} />
          <Route path="/payment-success" element={<PaymentSuccessPage />} />
          <Route path="/download/:token" element={<DownloadPage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}
