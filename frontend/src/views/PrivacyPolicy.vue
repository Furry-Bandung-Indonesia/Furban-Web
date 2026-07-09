<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-20">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <!-- English Version -->
      <template v-if="locale === 'en'">
        <div class="text-center mb-12">
          <h1 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">Privacy Policy</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">Last updated: February 19, 2026</p>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 md:p-12 space-y-8">
          <p class="text-gray-700 dark:text-gray-300 leading-relaxed">Furban ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our website and services, including the event ticketing system.</p>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">1. Information We Collect</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">We collect information you provide directly to us, such as when you create an account, upload content, purchase event tickets, or contact us. This may include your name, email address, username, date of birth, social link, and any content you submit (photos, blog posts, etc.).</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">2. Ticketing & Event Data</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">When you purchase a ticket for an event, we collect and store additional information required for event management, including your full name, date of birth, social link, dietary preferences (food selection), fursuiter status, and payment transaction records. This data is necessary to issue your ticket, facilitate check-in, and manage event logistics.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">3. How We Use Your Information</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">We use the information we collect to operate and improve our platform, manage user accounts, process ticket purchases and payments, facilitate event check-in procedures, display approved content in the gallery and blog, communicate with you about updates and event information, prevent fraud and enforce our terms, and ensure the security of our services.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">4. Data Sharing with Event Organisers</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">When you purchase a ticket, your personal information (name, contact details, dietary preferences) may be shared with the event organiser solely for the purposes of event management, check-in, and attendee coordination. Event organisers are bound by our terms to handle your data responsibly and must not share it with unauthorised third parties.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">5. Data Storage & Security</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">Your data is stored securely using Cloudflare infrastructure (D1 for database, R2 for media storage). We implement appropriate security measures including JWT-based authentication, password hashing, rate limiting, and moderation systems to protect your personal information and prevent unauthorised access.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">6. Content Sharing</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">Content you upload (photos, blog posts) will only be visible publicly after approval by an administrator. Rejected content will not be displayed publicly. You retain ownership of the content you create.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">7. Cookies & Local Storage</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">We use local storage to maintain your session (JWT tokens) and preferences (language setting, dark mode). We do not use third-party tracking cookies.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">8. Data Retention</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">Account data is retained as long as your account is active. Ticket and transaction records are retained for record-keeping and audit purposes even after the event has concluded. If your account is deregistered due to a terms violation, we may retain minimal records necessary for enforcement and fraud prevention.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">9. Your Rights</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">You have the right to access, update, or request deletion of your personal data. You may also request a copy of your data. Note that deletion of ticket transaction records may be restricted by legal or contractual obligations. Contact us at contact@furban.my.id for any privacy-related requests.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">10. Changes to This Policy</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page with a revised date.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">11. Contact</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">If you have questions about this Privacy Policy, please contact us at contact@furban.my.id.</p>
          </div>
        </div>
      </template>

      <!-- Indonesian Version -->
      <template v-else>
        <div class="text-center mb-12">
          <h1 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">Kebijakan Privasi</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">Terakhir diperbarui: 19 Februari 2026</p>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 md:p-12 space-y-8">
          <p class="text-gray-700 dark:text-gray-300 leading-relaxed">Furban ("kami") berkomitmen untuk melindungi privasi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi Anda saat menggunakan situs web dan layanan kami, termasuk sistem tiket acara.</p>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">1. Informasi yang Kami Kumpulkan</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">Kami mengumpulkan informasi yang Anda berikan secara langsung, seperti saat membuat akun, mengunggah konten, membeli tiket acara, atau menghubungi kami. Ini mencakup nama, alamat email, username, tanggal lahir, nomor telepon, dan konten yang Anda kirimkan (foto, posting blog, dll.).</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">2. Data Tiket & Acara</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">Saat Anda membeli tiket untuk acara, kami mengumpulkan dan menyimpan informasi tambahan yang diperlukan untuk manajemen acara, termasuk nama lengkap, tanggal lahir, nomor telepon, preferensi makanan, status fursuiter, dan catatan transaksi pembayaran. Data ini diperlukan untuk menerbitkan tiket, memfasilitasi check-in, dan mengelola logistik acara.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">3. Bagaimana Kami Menggunakan Informasi Anda</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">Kami menggunakan informasi yang dikumpulkan untuk mengoperasikan dan meningkatkan platform, mengelola akun pengguna, memproses pembelian tiket dan pembayaran, memfasilitasi prosedur check-in acara, menampilkan konten yang disetujui di galeri dan blog, berkomunikasi dengan Anda tentang pembaruan dan informasi acara, mencegah penipuan dan menegakkan ketentuan kami, serta memastikan keamanan layanan kami.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">4. Berbagi Data dengan Penyelenggara Acara</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">Saat Anda membeli tiket, informasi pribadi Anda (nama, detail kontak, preferensi makanan) dapat dibagikan kepada penyelenggara acara semata-mata untuk tujuan manajemen acara, check-in, dan koordinasi peserta. Penyelenggara acara terikat oleh ketentuan kami untuk menangani data Anda secara bertanggung jawab dan tidak boleh membagikannya kepada pihak ketiga yang tidak berwenang.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">5. Penyimpanan & Keamanan Data</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">Data Anda disimpan dengan aman menggunakan infrastruktur Cloudflare (D1 untuk database, R2 untuk penyimpanan media). Kami menerapkan langkah-langkah keamanan yang sesuai termasuk autentikasi berbasis JWT, hashing kata sandi, pembatasan rate, dan sistem moderasi untuk melindungi informasi pribadi Anda dan mencegah akses tidak sah.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">6. Berbagi Konten</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">Konten yang Anda unggah (foto, posting blog) hanya akan terlihat secara publik setelah disetujui oleh administrator. Konten yang ditolak tidak akan ditampilkan secara publik. Anda tetap memiliki hak atas konten yang Anda buat.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">7. Cookie & Penyimpanan Lokal</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">Kami menggunakan penyimpanan lokal untuk mempertahankan sesi Anda (token JWT) dan preferensi (pengaturan bahasa, mode gelap). Kami tidak menggunakan cookie pelacakan pihak ketiga.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">8. Retensi Data</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">Data akun disimpan selama akun Anda aktif. Catatan tiket dan transaksi disimpan untuk tujuan pencatatan dan audit bahkan setelah acara selesai. Jika akun Anda dinonaktifkan karena pelanggaran ketentuan, kami dapat menyimpan catatan minimal yang diperlukan untuk penegakan dan pencegahan penipuan.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">9. Hak Anda</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">Anda memiliki hak untuk mengakses, memperbarui, atau meminta penghapusan data pribadi Anda. Anda juga dapat meminta salinan data Anda. Perhatikan bahwa penghapusan catatan transaksi tiket mungkin dibatasi oleh kewajiban hukum atau kontraktual. Hubungi kami di contact@furban.my.id untuk permintaan terkait privasi.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">10. Perubahan Kebijakan Ini</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Kami akan memberitahu Anda tentang perubahan dengan memposting kebijakan baru di halaman ini dengan tanggal yang direvisi.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">11. Kontak</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami di contact@furban.my.id.</p>
          </div>
        </div>
      </template>

      <!-- Back -->
      <div class="text-center mt-8">
        <router-link to="/" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">
          &larr; {{ t('nav.home') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const { t, locale } = useI18n()
</script>
