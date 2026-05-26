import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { WhatsappLogo, Robot, X, CaretDown, CheckCircle, WarningCircle, Star } from '@phosphor-icons/react';
import { Toaster, toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const WA_NUMBER = "628998553333";
const WA_DISPLAY = "08998553333";
const WA_LINK = `https://wa.me/${WA_NUMBER}?text=Halo%2C%20saya%20ingin%20konsultasi%20dari%20website%20Skill%20Claude%20Riset%20Hibrida`;

const PRICE_STARTER = 79000;
const PRICE_SKILL = 199000;
const PRICE_MASTER = 499000;

const PROBLEM_CARDS = [
  { id: 'prob-1', icon: "🧟‍♂️", title: "Zombie Text", desc: "Output AI yang panjang tapi tidak berjiwa. Revisi tanpa akhir." },
  { id: 'prob-2', icon: "🎭", title: "Halusinasi Referensi", desc: "AI mengarang jurnal yang tidak ada. Malu di depan penguji." },
  { id: 'prob-3', icon: "❌", title: "Tanpa Metodologi", desc: "Cepat menghasilkan teks, tapi tidak bisa dipertanggungjawabkan secara akademik." }
];

const IRDR_PHASES = [
  { id: 'phase-1', icon: "🔵", name: "INJECT", desc: "Mengunci paradigma & rumusan masalah. Fondasi riset yang tidak bisa digoyang." },
  { id: 'phase-2', icon: "🟢", name: "RAPID", desc: "Eksplorasi literatur massal. Peta diskursus ilmiah dalam hitungan menit." },
  { id: 'phase-3', icon: "🔴", name: "DIAGNOSE", desc: "Membunuh zombie text & halusinasi. Audit integritas sebelum terlambat." },
  { id: 'phase-4', icon: "🟡", name: "REFINE", desc: "Menghaluskan narasi akademik. Suara peneliti tetap terdengar." }
];

const BUNDLE_FEATURES = [
  { id: "feat-irdr", title: "Framework iRDR", desc: "Peta kolaborasi manusia-AI yang terstruktur" },
  { id: "feat-rag", title: "Teknik R.A.G.", desc: "AI menjawab berbasis data nyata, bukan halusinasi" },
  { id: "feat-sense", title: "Sensory Grounding", desc: "Turun ke lapangan sebelum bertanya ke AI" },
  { id: "feat-tri", title: "Triangulasi Data", desc: "Validasi dari tiga arah" },
  { id: "feat-dezom", title: "De-zombifikasi", desc: "Menghidupkan kembali teks tanpa jiwa" },
  { id: "feat-dig", title: "Dignity Check", desc: "Lima pertanyaan sebelum tanda tangan" },
  { id: "feat-case", title: "Studi Kasus", desc: "Ahmad, Rina, Budi — tiga jalur berbeda" },
  { id: "feat-prompt", title: "35 Prompt Siap Pakai", desc: "Terstruktur per fase iRDR" }
];

const TESTIMONIALS = [
  { id: "test-1", quote: "Buku ini memberi perspektif baru tentang bagaimana AI dapat digunakan secara cerdas dalam penelitian. Bukan sekadar cepat, tetapi tetap menjaga kualitas dan integritas akademik.", author: "Dr. Rina Kurniasih, Dosen & Peneliti" },
  { id: "test-2", quote: "Bahasanya jelas, aplikatif, dan langsung bisa dipraktikkan. Saya jadi lebih paham bagaimana memanfaatkan AI untuk menyusun proposal, analisis data, hingga penulisan tesis.", author: "Andi Pratama, Mahasiswa Pascasarjana" },
  { id: "test-3", quote: "Referensi yang relevan untuk kampus masa kini. Buku ini menjembatani kebutuhan akademik tradisional dengan transformasi digital yang sedang berlangsung.", author: "Prof. Budi Santoso, Akademisi & Reviewer Jurnal" }
];

const FAQS = [
  { id: "faq-1", q: "Apa perbedaan Skill Pack dan Master Bundle?", a: "Skill Pack berisi semua tools untuk mulai (SKILL file, 35 prompt, template). Master Bundle menambahkan dua buku digital, prompt khusus per disiplin ilmu, rekaman webinar, dan update seumur hidup + bonus eksklusif 200 pembeli pertama." },
  { id: "faq-2", q: "Apakah saya perlu berlangganan Claude Pro?", a: "Tidak wajib. Claude versi gratis sudah bisa menggunakan SKILL file di Projects. Namun Claude Pro memberikan lebih banyak pesan per hari." },
  { id: "faq-3", q: "Bagaimana cara menginstal SKILL file ke Claude?", a: "Mudah — buka claude.ai, buat Project baru, paste isi SKILL file ke 'Project instructions'. Panduan instalasi sudah ada di dalam paket." },
  { id: "faq-4", q: "Bagaimana cara mendapat link download setelah bayar?", a: "Otomatis — link download dikirim ke email Anda dalam 5 menit setelah pembayaran terkonfirmasi. Cek folder spam jika tidak menerima." }
];

const PRICING_PLANS = [
  {
    id: 'starter',
    name: 'Prompt Pack + Skill RH',
    price: PRICE_STARTER,
    target: 'Mahasiswa S1/S2 yang baru mulai',
    includes: [
      '35 Prompt Siap Pakai (PDF + TXT)',
      'SKILL Riset Hibrida untuk Claude Projects',
      'Panduan Instalasi Langkah demi Langkah',
      'Panduan Penggunaan 1 Halaman',
      'Update 1 Tahun Gratis'
    ],
    excludes: [
      '4 Skill Eksklusif',
      'Template Dokumen',
      'Buku Cetak'
    ],
    buttonText: 'Beli Paket 1 →',
    isFeatured: false
  },
  {
    id: 'skill',
    name: 'RH Skill Pack',
    badge: '⭐ PALING LENGKAP',
    price: PRICE_SKILL,
    target: 'Mahasiswa S2/S3 & Dosen aktif meneliti',
    includes: [
      'Semua isi Paket 1',
      'Template Research Blueprint (DOCX)',
      'Template Synthesis Matrix (XLSX)',
      '4 SKILL Eksklusif: RAG, Dignity Check, Triangulasi, De-Zombifikasi',
      'Update 2 Tahun Gratis'
    ],
    excludes: [
      'Prompt per Disiplin',
      'Video Webinar',
      'Buku Cetak'
    ],
    buttonText: 'Beli RH Skill Pack →',
    isFeatured: true
  },
  {
    id: 'master',
    name: 'Master Bundle',
    badge: '🏆 TERLENGKAP',
    price: PRICE_MASTER,
    target: 'Peneliti serius',
    urgency: '200 Pembeli Pertama: Webinar + Sertifikat SPAK/BKD',
    includes: [
      'Semua isi Paket 1 + Paket 2',
      'Prompt Khusus per Disiplin (30 prompt)',
      '10 Skill Komunitas Open Source',
      'Rekaman Video Webinar',
      'Update Seumur Hidup'
    ],
    physical: [
      'Buku Cetak "Riset Hibrida 2.0" — ITB Press',
      'Buku Cetak "Protokol Riset Hibrida 2.1" — ITB Press'
    ],
    bonus: 'Bonus 200 Pembeli Pertama: Undangan Eksklusif Webinar & Sertifikat SPAK/BKD',
    note: '*Belum termasuk ongkir buku — dikonfirmasi via WA setelah bayar',
    buttonText: 'Klaim Master Bundle →',
    isFeatured: false,
    isMaster: true
  }
];

const ANIMATIONS = {
  fadeIn: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
  modal: { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 } },
  image: { initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { duration: 0.8 } },
  chatModal: { initial: { opacity: 0, y: 50 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 50 } }
};

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
  return <button ref={ref} className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
});

const Input = React.forwardRef(({ className = "", ...props }, ref) => (
  <input ref={ref} className={`flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />
));

const Label = React.forwardRef(({ className = "", ...props }, ref) => (
  <label ref={ref} className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`} {...props} />
));

function Dialog({ open, onOpenChange, children }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div {...ANIMATIONS.fadeIn} onClick={() => onOpenChange(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div {...ANIMATIONS.modal} className="z-50 w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function HeroSection() {
  const [slots, setSlots] = useState(200);

  useEffect(() => {
    let mounted = true;
    const fetchSlots = async () => {
      try {
        const res = await fetch(`${API_URL}/api/slots`);
        const data = await res.json();
        if (mounted) setSlots(data.remaining);
      } catch (e) {
        // ignore
      }
    };
    fetchSlots();
    return () => { mounted = false; };
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
            {...ANIMATIONS.image}
            src="https://customer-assets.emergentagent.com/job_riset-hibrida/artifacts/rh91wnql_hero.png" 
            alt="Skill Claude Book Cover" 
            className="rounded-2xl shadow-2xl shadow-gold/20 w-full max-w-md mx-auto"
          />
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
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
          {PROBLEM_CARDS.map((item) => (
            <div key={item.id} className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center hover:-translate-y-2 transition-transform duration-300">
              <div className="text-5xl mb-4">{item.icon}</div>
              <h3 className="text-xl font-bold text-navy mb-2">{item.title}</h3>
              <p className="text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function IRDRSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-navy text-center mb-16">
          Proses Framework iRDR
        </h2>
        <div className="flex overflow-x-auto md:grid md:grid-cols-4 gap-6 pb-8 snap-x">
          {IRDR_PHASES.map((phase) => (
            <div key={phase.id} className="min-w-[280px] bg-slate-50 p-6 rounded-xl border border-slate-100 snap-center">
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
}

function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-navy text-center mb-16">
          Apa yang Ada di Dalam Bundle
        </h2>
        <div className="grid md:grid-cols-4 gap-6">
          {BUNDLE_FEATURES.map((feat) => (
            <div key={feat.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-bold text-navy mb-2">{feat.title}</h3>
              <p className="text-sm text-slate-600">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingCard({ plan, onSelect }) {
  return (
    <div className={`bg-white rounded-2xl p-8 shadow-xl ${plan.isFeatured ? 'shadow-gold/20 border-2 border-gold transform md:-translate-y-4 relative' : ''}`}>
      {plan.badge && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white px-4 py-1 rounded-full text-sm font-bold tracking-wider">
          {plan.badge}
        </div>
      )}
      <h3 className="text-2xl font-bold text-navy mb-2">{plan.name}</h3>
      <div className="text-3xl font-display font-bold text-gold mb-2">Rp {plan.price.toLocaleString('id-ID')}</div>
      <p className="text-slate-500 text-sm mb-6">{plan.target}</p>
      
      {plan.urgency && <div className="text-red-600 text-sm font-bold mb-4">{plan.urgency}</div>}
      
      <ul className="space-y-4 mb-8">
        {plan.includes.map((item, i) => (
          <li key={`inc-${i}`} className="flex items-start gap-2"><CheckCircle className="text-whatsapp shrink-0 mt-1"/> <span className="text-sm">{item}</span></li>
        ))}
        {plan.physical && plan.physical.map((item, i) => (
          <li key={`phys-${i}`} className="flex items-start gap-2"><span className="text-lg shrink-0">📦</span> <span className="text-sm">{item}</span></li>
        ))}
        {plan.bonus && (
          <li className="flex items-start gap-2 bg-slate-50 p-2 rounded text-sm text-navy font-medium border border-gold/30">
            <span className="shrink-0">🎁</span><span>{plan.bonus}</span>
          </li>
        )}
        {plan.excludes && plan.excludes.map((item, i) => (
          <li key={`exc-${i}`} className="flex items-start gap-2 text-slate-400"><X className="text-red-400 shrink-0 mt-1"/> <span className="text-sm">{item}</span></li>
        ))}
      </ul>
      
      {plan.note && <div className="text-xs text-slate-500 mb-4">{plan.note}</div>}
      
      <Button 
        className={`w-full ${plan.isMaster ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`} 
        variant={plan.isFeatured ? "primary" : (plan.isMaster ? "navy" : "outline")} 
        onClick={() => onSelect(plan.id, plan.price, plan.name)}
        data-testid={`buy-${plan.id}`}
      >
        {plan.buttonText}
      </Button>
    </div>
  );
}

function PricingSection({ onSelectPlan }) {
  return (
    <section id="pricing" className="py-24 bg-navy relative clip-diagonal">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-white text-center mb-4">
          Pilih Paket yang Sesuai Kebutuhan Anda
        </h2>
        <div className="grid md:grid-cols-3 gap-8 items-start mt-12">
          {PRICING_PLANS.map(plan => <PricingCard key={plan.id} plan={plan} onSelect={onSelectPlan} />)}
        </div>
      </div>
    </section>
  );
}

function WebinarPromo() {
  return (
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
}

function BooksSection() {
  return (
    <section className="py-16 bg-slate-100">
      <div className="max-w-5xl mx-auto px-4 text-center">
        <h2 className="text-2xl font-bold text-navy mb-8">Lebih Suka Buku Fisik?</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <img src="https://risethibrida.com/wp-content/uploads/2026/04/buatkan_mockup_background_202604140021-1024x572.jpeg" alt="Buku 1" className="w-full h-48 object-cover rounded-lg mb-4"/>
            <h4 className="font-bold text-lg mb-2">Riset Hibrida 2.0</h4>
            <p className="text-slate-500 mb-4 text-sm">Rp 170.000 (belum ongkir) | 218 hal | ITB Press</p>
            <Button variant="outline" className="w-full" onClick={()=>window.open(WA_LINK)} data-testid="buy-book-1">Pesan via WhatsApp</Button>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <img src="https://risethibrida.com/wp-content/uploads/2026/04/buatkan_mockup_background_202604140023-1024x572.jpeg" alt="Buku 2" className="w-full h-48 object-cover rounded-lg mb-4"/>
            <h4 className="font-bold text-lg mb-2">Protokol Riset Hibrida 2.1</h4>
            <p className="text-slate-500 mb-4 text-sm">Rp 170.000 (belum ongkir) | 156 hal | ITB Press</p>
            <Button variant="outline" className="w-full" onClick={()=>window.open(WA_LINK)} data-testid="buy-book-2">Pesan via WhatsApp</Button>
          </div>
        </div>
        <div className="mt-8">
          <p className="text-navy font-bold mb-4">Bundel 2 Buku: Rp 330.000 (belum ongkir)</p>
          <Button variant="primary" onClick={()=>window.open(WA_LINK)} data-testid="buy-book-bundle">Pesan Bundel 2 Buku via WhatsApp</Button>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="py-20 bg-navy text-white clip-diagonal">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-16">Apa Kata Mereka?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t) => (
            <div key={t.id} className="bg-navy-light p-8 rounded-2xl border border-slate-700">
              <div className="flex gap-1 mb-4 text-gold">
                {[...Array(5)].map((_, idx) => <Star key={`star-${t.id}-${idx}`} weight="fill" />)}
              </div>
              <p className="italic text-slate-300 mb-6">"{t.quote}"</p>
              <div className="font-bold text-white">— {t.author}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-3xl font-display font-bold text-navy text-center mb-10">Tanya Jawab (FAQ)</h2>
        <div className="space-y-4">
          {FAQS.map((faq) => (
            <details key={faq.id} className="group bg-slate-50 rounded-lg border border-slate-200">
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
}

function CheckoutModal({ open, setOpen, selectedPlan }) {
  const schema = z.object({
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
        body: JSON.stringify({ product: selectedPlan.id, customer: data })
      });
      const result = await res.json();
      if (!result.snap_token) throw new Error(result.detail || 'Snap token tidak ditemukan');

      sessionStorage.setItem('rh_pending_order', JSON.stringify({
        orderId: result.merchantOrderId,
        email: data.email,
        name: data.name,
        product: selectedPlan.id,
      }));

      if (!window.snap) {
        const script = document.createElement('script');
        script.src = result.is_production
          ? 'https://app.midtrans.com/snap/snap.js'
          : 'https://app.sandbox.midtrans.com/snap/snap.js';
        script.setAttribute('data-client-key', result.client_key);
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      setOpen(false);
      window.snap.pay(result.snap_token, {
        onSuccess: () => { window.location.href = '/payment-status'; },
        onPending: () => { window.location.href = '/payment-status'; },
        onError:   () => { toast.error("Pembayaran gagal. Silakan coba lagi."); },
        onClose:   () => {},
      });
    } catch(err) {
      console.error(err);
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
}

function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'model', content: 'Halo! Saya Asisten Riset Hibrida. Ada yang bisa saya bantu terkait produk atau metodologi riset?' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if(scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, scrollRef]);

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
    <div className="fixed bottom-24 right-6 z-50">
      <AnimatePresence>
        {open && (
          <motion.div {...ANIMATIONS.chatModal} className="absolute bottom-16 right-0 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-96">
            <div className="bg-navy text-white p-4 font-bold flex justify-between items-center">
              <div className="flex items-center gap-2"><Robot size={24}/> Tanya Asisten</div>
              <button onClick={() => setOpen(false)} data-testid="close-chat"><X size={20}/></button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-4" ref={scrollRef}>
              {messages.map((m, i) => (
                <div key={`msg-${i}`} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
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
}

function WhatsAppWidget() {
  return (
    <a 
      href={WA_LINK}
      target="_blank" rel="noopener noreferrer"
      className="fixed bottom-24 left-6 z-50 bg-whatsapp text-white px-4 py-3 rounded-full flex items-center gap-3 shadow-xl hover:scale-105 transition-transform"
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
}

function Footer() {
  return (
    <footer className="bg-navy-light text-slate-400 py-12 text-center text-sm">
      <div className="flex justify-center mb-6">
        <img src="https://risethibrida.com/wp-content/uploads/2026/04/cropped-itbpress-color.png" alt="ITB Press" className="h-12 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all"/>
      </div>
      <p className="mb-4 text-white font-medium">Manusia Tetap Nakhoda. AI adalah Radarnya.</p>
      <p className="mb-4">© 2026 Didi Subandi & Dr. Yully Ambarsih Ekawardhani | ITB Press. All rights reserved.</p>
      <p>Email: risethibrida@gmail.com | WA: {WA_DISPLAY}</p>
    </footer>
  );
}

function LandingPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const openCheckout = useCallback((id, price, name) => {
    setSelectedPlan({ id, price, name });
    setModalOpen(true);
  }, []);

  return (
    <div className="min-h-screen relative font-body selection:bg-gold selection:text-white">
      <HeroSection />
      <ProblemSection />
      <IRDRSection />
      <FeaturesSection />
      <PricingSection onSelectPlan={openCheckout} />
      <WebinarPromo />
      <BooksSection />
      <TestimonialsSection />
      <FAQSection />

      <CheckoutModal open={modalOpen} setOpen={setModalOpen} selectedPlan={selectedPlan} />
      <ChatbotWidget />
      <WhatsAppWidget />
      
      <Footer />
    </div>
  );
}

function PaymentStatusPage() {
  const stored = (() => {
    try { return JSON.parse(sessionStorage.getItem('rh_pending_order') || 'null'); } catch { return null; }
  })();

  const [status, setStatus] = useState('loading');
  const [order, setOrder] = useState(null);
  const startedAt = useRef(Date.now());
  const POLL_INTERVAL = 4000;
  const POLL_MAX_MS = 5 * 60_000;

  useEffect(() => {
    if (!stored?.orderId || !stored?.email) { setStatus('error'); return; }
    let cancelled = false;
    let timer = null;

    const poll = async () => {
      try {
        const res = await fetch(`${API_URL}/api/order-status?orderId=${stored.orderId}&email=${encodeURIComponent(stored.email)}`);
        if (cancelled) return;
        const data = await res.json();
        setOrder(data);
        if (data.status === 'paid') { setStatus('success'); return; }
        if (['failed', 'failure', 'cancel', 'expire', 'deny'].includes(data.status)) { setStatus('failed'); return; }
        if (Date.now() - startedAt.current > POLL_MAX_MS) { setStatus('timeout'); return; }
        timer = setTimeout(poll, POLL_INTERVAL);
      } catch(e) {
        if (cancelled) return;
        setStatus('error');
      }
    };
    poll();
    return () => { cancelled = true; if(timer) clearTimeout(timer); };
  }, []);

  const card = (children) => (
    <div className="min-h-screen flex items-center justify-center bg-navy p-4">
      <div className="bg-white text-navy p-10 rounded-2xl shadow-2xl max-w-md w-full text-center">{children}</div>
    </div>
  );

  if (status === 'loading') return card(
    <>
      <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-6"/>
      <h2 className="text-2xl font-bold mb-2">Memverifikasi Pembayaran...</h2>
      <p className="text-slate-500">Menunggu konfirmasi dari Midtrans</p>
    </>
  );

  if (status === 'success') return card(
    <>
      <CheckCircle size={64} className="text-whatsapp mx-auto mb-6" weight="fill"/>
      <h2 className="text-3xl font-display font-bold mb-2">Pembayaran Berhasil!</h2>
      <p className="text-slate-600 mb-6">Terima kasih, {order?.customer?.name || stored?.name}! File siap diunduh.</p>
      <Button className="w-full mb-3" variant="primary" onClick={() => window.location.href = `/download/${order?.downloadToken}`} data-testid="download-btn">
        Akses File Download
      </Button>
      <Button className="w-full" variant="outline" onClick={() => window.location.href='/'} data-testid="home-btn">
        Kembali ke Beranda
      </Button>
      <p className="text-xs text-slate-400 mt-4">Simpan halaman ini atau link download untuk akses ulang.</p>
    </>
  );

  if (status === 'failed') return card(
    <>
      <WarningCircle size={64} className="text-red-500 mx-auto mb-6" weight="fill"/>
      <h2 className="text-3xl font-bold mb-2">Pembayaran Gagal</h2>
      <p className="text-slate-600 mb-6">Pembayaran tidak berhasil. Silakan coba lagi.</p>
      <Button className="w-full" variant="primary" onClick={() => window.location.href='/'} data-testid="retry-btn">Coba Lagi</Button>
    </>
  );

  if (status === 'timeout') return card(
    <>
      <WarningCircle size={64} className="text-gold mx-auto mb-6" weight="fill"/>
      <h2 className="text-2xl font-bold mb-2">Konfirmasi Tertunda</h2>
      <p className="text-slate-600 mb-2">Bank butuh waktu lebih lama. Refresh atau hubungi admin.</p>
      <p className="text-sm text-slate-400 mb-6 font-mono">Order ID: {stored?.orderId}</p>
      <Button className="w-full mb-3" variant="primary" onClick={() => window.location.reload()} data-testid="refresh-btn">Refresh</Button>
      <Button className="w-full" variant="outline" onClick={() => window.open(WA_LINK)} data-testid="wa-btn">Hubungi Admin WA</Button>
    </>
  );

  return card(
    <>
      <WarningCircle size={64} className="text-red-500 mx-auto mb-6" weight="fill"/>
      <h2 className="text-2xl font-bold mb-2">Tidak Dapat Memuat Status</h2>
      <p className="text-slate-600 mb-6">Silakan hubungi admin via WhatsApp.</p>
      <Button className="w-full" variant="outline" onClick={() => window.open(WA_LINK)} data-testid="wa-btn">Hubungi Admin WA</Button>
    </>
  );
}

function DownloadPage() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');
  const [order, setOrder] = useState(null);

  useEffect(() => {
    let mounted = true;
    const validate = async () => {
      try {
        const res = await fetch(`${API_URL}/api/download/${token}`);
        const data = await res.json();
        if (mounted) {
          if (res.ok) { setOrder(data); setStatus('success'); }
          else setStatus('error');
        }
      } catch (e) {
        if (mounted) setStatus('error');
      }
    };
    validate();
    return () => { mounted = false; };
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md w-full text-center">
        {status === 'loading' && <p className="text-slate-500">Memvalidasi akses...</p>}
        {status === 'success' && (
          <>
            <CheckCircle size={64} className="text-whatsapp mx-auto mb-4" weight="fill"/>
            <h2 className="text-2xl font-bold mb-2">Download Siap</h2>
            <p className="text-slate-500 mb-1">Hai, {order?.customerName}!</p>
            <p className="text-sm text-slate-400 mb-6 capitalize">Paket: {order?.product}</p>
            <p className="text-sm text-slate-500 mb-6 bg-gold/10 border border-gold/30 rounded p-3">
              File digital akan segera tersedia di sini. Tim kami juga mengirimkan link ke email Anda.
              Untuk pertanyaan, hubungi WhatsApp 08998553333.
            </p>
            <Button className="w-full mb-3" variant="primary" onClick={() => window.open(WA_LINK)} data-testid="download-btn">
              Konfirmasi via WhatsApp
            </Button>
            <Button className="w-full" variant="outline" onClick={() => window.location.href='/'} data-testid="home-btn">
              Kembali ke Beranda
            </Button>
          </>
        )}
        {status === 'error' && (
          <>
            <WarningCircle size={64} className="text-red-500 mx-auto mb-4" weight="fill"/>
            <h2 className="text-2xl font-bold mb-4">Token Tidak Valid</h2>
            <p className="text-slate-500 mb-6">Silakan hubungi admin via WhatsApp.</p>
            <Button variant="outline" onClick={() => window.open(WA_LINK)} data-testid="wa-btn">Hubungi Admin WA</Button>
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
          <Route path="/payment-status" element={<PaymentStatusPage />} />
          <Route path="/payment-success" element={<PaymentStatusPage />} />
          <Route path="/download/:token" element={<DownloadPage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}
