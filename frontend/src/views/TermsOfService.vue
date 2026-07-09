<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-20">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <!-- English Version -->
      <template v-if="locale === 'en'">
        <div class="text-center mb-12">
          <h1 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">Terms of Service</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">Last updated: February 19, 2026</p>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 md:p-12 space-y-8">
          <p class="text-gray-700 dark:text-gray-300 leading-relaxed">By accessing or using the Furban platform, including the event ticketing system, you agree to be bound by these Terms of Service. Please read them carefully.</p>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">1. Acceptance of Terms</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">By creating an account, purchasing a ticket, or using our services, you acknowledge that you have read, understood, and agree to these terms. If you do not agree, please do not use the platform.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">2. User Accounts</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate information during registration and ticket purchases. Each person may only have one account. Providing false personal information (including name, date of birth, or contact details) is a violation of these terms.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">3. User Roles</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">Users are assigned roles (Photographer, Publisher, or Admin) that define their permissions. Photographers and Publishers can upload photos and blog posts. Only Admins can approve, reject, or moderate content and manage user roles.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">4. Content Guidelines</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">All uploaded content must comply with our community guidelines. Content must not be illegal, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable. Uploaded images must be in PNG, JPG, or WEBP format and not exceed 8MB in size.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">5. Content Approval</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">All submitted content goes through an approval process. Only content approved by an administrator will be publicly visible. We reserve the right to reject any content that violates our guidelines, with a reason provided.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">6. Event Ticketing Services</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">Furban provides an event ticketing platform that allows organisers to create events and sell tickets, and allows users to purchase tickets and attend events. By using the ticketing service, you agree to the following: tickets are issued only after successful payment confirmation; each ticket is personal and non-transferable unless authorised by the event organiser; ticket availability is subject to quota limits which may be adjusted by the organiser at any time; the organiser reserves the right to limit ticket sales, modify event schedules, change venue, or alter event programming.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">7. Ticket Purchase, Payment & Refunds</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">Ticket numbers are assigned only after payment is verified. Unpaid tickets will expire automatically after the designated claim window. If an event is cancelled by the organiser, ticket holders are entitled to a full refund. Attendee-initiated cancellations are subject to the organiser's refund policy. No-shows are not eligible for refunds. All payment information is processed securely through the platform.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">8. Right to Revoke Tickets</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">The organiser and/or Furban reserve the right to revoke any ticket if the attendee: provided false or fraudulent personal information; engaged in ticket scalping, resale, or unauthorised transfer; violated the event's code of conduct or community guidelines; engaged in harassment, threats, or any form of misconduct; attempted to circumvent security measures, forge QR codes, or duplicate tickets; or was found on the event's moderation or ban list. Revoked tickets are void and non-refundable.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">9. Malpractice & Fraud Prevention</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">Any attempt to manipulate the ticketing system — including automated bulk purchasing, QR code forgery, account impersonation, or exploitation of system vulnerabilities — is strictly prohibited. The platform employs rate limiting, moderation lists, and verification mechanisms to detect and prevent fraud. Circumventing these security measures is a serious violation of these terms.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">10. Enforcement & Account Consequences</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">Failure to comply with these Terms of Service may result in escalating consequences at the sole discretion of the organiser or platform administrators: (a) Warning and notation on the user's account; (b) Immediate ticket revocation without refund; (c) Denial of entry or removal from an event; (d) Temporary suspension of the user's Furban account; (e) Permanent deregistration (ban) of the user's account on the Furban platform. The platform reserves the right to report illegal activities to the appropriate authorities.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">11. Intellectual Property</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">You retain ownership of the content you upload. By uploading content, you grant Furban a non-exclusive license to display and distribute your content on the platform. You must only upload content you have the right to share.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">12. Prohibited Conduct</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">You may not: attempt to gain unauthorised access to other accounts or systems; upload malicious files; circumvent the content approval process or ticketing security mechanisms; impersonate others; engage in ticket scalping or fraudulent transactions; or use the platform for any unlawful purpose.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">13. Termination</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">We reserve the right to suspend or terminate accounts that violate these terms. Accounts involved in ticketing fraud, malpractice, or repeated violations may be permanently deregistered without prior notice. You may also request deletion of your account by contacting us.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">14. Limitation of Liability</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">Furban is provided "as is" without warranties of any kind. We are not liable for any damages resulting from the use or inability to use the platform, including but not limited to event cancellations, denied entry, or ticket revocation resulting from a user's violation of these terms. Attendance at events is at the user's own risk.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">15. Changes to Terms</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">We may modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms. For material changes affecting existing ticket holders, we will provide reasonable notice through the platform.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">16. Contact</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">For questions about these terms, contact us at contact@furban.my.id.</p>
          </div>
        </div>
      </template>

      <!-- Indonesian Version -->
      <template v-else>
        <div class="text-center mb-12">
          <h1 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">Ketentuan Layanan</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">Terakhir diperbarui: 19 Februari 2026</p>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 md:p-12 space-y-8">
          <p class="text-gray-700 dark:text-gray-300 leading-relaxed">Dengan mengakses atau menggunakan platform Furban, termasuk sistem tiket acara, Anda setuju untuk terikat oleh Ketentuan Layanan ini. Harap baca dengan seksama.</p>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">1. Penerimaan Ketentuan</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">Dengan membuat akun, membeli tiket, atau menggunakan layanan kami, Anda mengakui bahwa Anda telah membaca, memahami, dan menyetujui ketentuan ini. Jika Anda tidak setuju, harap jangan gunakan platform ini.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">2. Akun Pengguna</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">Anda bertanggung jawab untuk menjaga kerahasiaan kredensial akun Anda. Anda harus memberikan informasi yang akurat saat pendaftaran dan pembelian tiket. Setiap orang hanya boleh memiliki satu akun. Memberikan informasi pribadi palsu (termasuk nama, tanggal lahir, atau detail kontak) merupakan pelanggaran terhadap ketentuan ini.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">3. Peran Pengguna</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">Pengguna diberikan peran (Fotografer, Penerbit, atau Admin) yang menentukan izin mereka. Fotografer dan Penerbit dapat mengunggah foto dan posting blog. Hanya Admin yang dapat menyetujui, menolak, atau memoderasi konten dan mengelola peran pengguna.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">4. Pedoman Konten</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">Semua konten yang diunggah harus mematuhi pedoman komunitas kami. Konten tidak boleh ilegal, berbahaya, mengancam, kasar, melecehkan, memfitnah, atau tidak pantas. Gambar yang diunggah harus dalam format PNG, JPG, atau WEBP dan tidak melebihi 8MB.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">5. Persetujuan Konten</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">Semua konten yang dikirimkan melalui proses persetujuan. Hanya konten yang disetujui oleh administrator yang akan terlihat secara publik. Kami berhak menolak konten yang melanggar pedoman kami, dengan alasan yang diberikan.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">6. Layanan Tiket Acara</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">Furban menyediakan platform tiket acara yang memungkinkan penyelenggara membuat acara dan menjual tiket, serta memungkinkan pengguna membeli tiket dan menghadiri acara. Dengan menggunakan layanan tiket, Anda setuju bahwa: tiket hanya diterbitkan setelah konfirmasi pembayaran berhasil; setiap tiket bersifat pribadi dan tidak dapat dipindahtangankan kecuali diizinkan oleh penyelenggara; ketersediaan tiket tunduk pada batas kuota yang dapat disesuaikan oleh penyelenggara kapan saja; penyelenggara berhak membatasi penjualan tiket, mengubah jadwal acara, mengubah tempat, atau mengubah program acara.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">7. Pembelian Tiket, Pembayaran & Pengembalian Dana</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">Nomor tiket hanya diberikan setelah pembayaran diverifikasi. Tiket yang belum dibayar akan kedaluwarsa secara otomatis setelah jendela klaim yang ditentukan. Jika acara dibatalkan oleh penyelenggara, pemegang tiket berhak atas pengembalian dana penuh. Pembatalan yang diinisiasi peserta tunduk pada kebijakan pengembalian dana penyelenggara. Ketidakhadiran tanpa pemberitahuan tidak berhak atas pengembalian dana. Semua informasi pembayaran diproses secara aman melalui platform.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">8. Hak Pencabutan Tiket</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">Penyelenggara dan/atau Furban berhak mencabut tiket apa pun jika peserta: memberikan informasi pribadi palsu atau curang; terlibat dalam calo tiket, penjualan kembali, atau transfer tanpa izin; melanggar kode etik acara atau pedoman komunitas; terlibat dalam pelecehan, ancaman, atau bentuk perilaku buruk apa pun; berusaha mengelabui langkah-langkah keamanan, memalsukan kode QR, atau menggandakan tiket; atau ditemukan dalam daftar moderasi atau larangan acara. Tiket yang dicabut tidak berlaku dan tidak dapat dikembalikan dananya.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">9. Pencegahan Malpraktik & Penipuan</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">Segala upaya untuk memanipulasi sistem tiket — termasuk pembelian massal otomatis, pemalsuan kode QR, peniruan identitas akun, atau eksploitasi kerentanan sistem — dilarang keras. Platform menggunakan pembatasan rate, daftar moderasi, dan mekanisme verifikasi untuk mendeteksi dan mencegah penipuan. Mengelabui langkah-langkah keamanan ini merupakan pelanggaran serius terhadap ketentuan ini.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">10. Penegakan & Konsekuensi Akun</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">Kegagalan mematuhi Ketentuan Layanan ini dapat mengakibatkan konsekuensi bertingkat atas kebijaksanaan tunggal penyelenggara atau administrator platform: (a) Peringatan dan catatan pada akun pengguna; (b) Pencabutan tiket segera tanpa pengembalian dana; (c) Penolakan masuk atau pemindahan dari acara; (d) Penangguhan sementara akun Furban pengguna; (e) Penonaktifan permanen (larangan) akun pengguna di platform Furban. Platform berhak melaporkan aktivitas ilegal kepada pihak berwenang yang berwajib.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">11. Kekayaan Intelektual</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">Anda tetap memiliki hak atas konten yang Anda unggah. Dengan mengunggah konten, Anda memberikan Furban lisensi non-eksklusif untuk menampilkan dan mendistribusikan konten Anda di platform. Anda hanya boleh mengunggah konten yang Anda miliki haknya.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">12. Perilaku yang Dilarang</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">Anda tidak boleh: mencoba mendapatkan akses tidak sah ke akun atau sistem lain; mengunggah file berbahaya; menghindari proses persetujuan konten atau mekanisme keamanan tiket; menyamar sebagai orang lain; terlibat dalam calo tiket atau transaksi curang; atau menggunakan platform untuk tujuan melanggar hukum.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">13. Penghentian</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">Kami berhak menangguhkan atau menghentikan akun yang melanggar ketentuan ini. Akun yang terlibat dalam penipuan tiket, malpraktik, atau pelanggaran berulang dapat dinonaktifkan secara permanen tanpa pemberitahuan sebelumnya. Anda juga dapat meminta penghapusan akun Anda dengan menghubungi kami.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">14. Batasan Tanggung Jawab</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">Furban disediakan "apa adanya" tanpa jaminan apa pun. Kami tidak bertanggung jawab atas kerugian yang diakibatkan oleh penggunaan atau ketidakmampuan menggunakan platform, termasuk namun tidak terbatas pada pembatalan acara, penolakan masuk, atau pencabutan tiket yang diakibatkan oleh pelanggaran ketentuan ini oleh pengguna. Kehadiran di acara merupakan risiko pengguna sendiri.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">15. Perubahan Ketentuan</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">Kami dapat mengubah ketentuan ini kapan saja. Penggunaan platform yang berkelanjutan setelah perubahan merupakan penerimaan terhadap ketentuan baru. Untuk perubahan material yang mempengaruhi pemegang tiket yang ada, kami akan memberikan pemberitahuan yang wajar melalui platform.</p>
          </div>
          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">16. Kontak</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">Untuk pertanyaan tentang ketentuan ini, hubungi kami di contact@furban.my.id.</p>
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
