import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Music2,
  Sparkles,
  Download,
  Search,
  Palette,
  Moon,
  Menu,
  Upload,
  RefreshCw,
  Loader2,
  X,
  LogOut,
  Lock,
  ShieldCheck,
  Trash2,
  Pencil,
  Gauge,
  ArrowDownUp,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { uploadSong, deleteSong, renameSong } from "@/lib/songs.functions";
import { listSongs } from "@/lib/songs-list.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "WanrifalRemix - Offline Music Player" },
      { name: "description", content: "Pemutar musik WanrifalRemix" },
    ],
  }),
});

type Track = { title: string; artist: string; url: string; addedAt?: string | null };
type SortBy = "name" | "newest";

const BASE = "https://cdn.jsdelivr.net/gh/wanrifalgg/song@main/";
const FALLBACK_TRACKS: Track[] = [
  { title: "HALISUSSUNG", artist: "WanrifalRemix", url: BASE + "HALISUSSUNG.mp3" },
  { title: "kujawab ya ya", artist: "WanrifalRemix", url: BASE + "kujawab%20ya%20ya.mp3" },
  { title: "nyanyikanlah", artist: "WanrifalRemix", url: BASE + "nyanyikanlah.mp3" },
  { title: "PAREMAN LONTONG", artist: "WanrifalRemix", url: BASE + "PAREMAN%20LONTONG.mp3" },
];

const QUOTES_LUCU = [
  '"Bekerjalah seolah kamu tidak butuh uang, tapi cicilanmu tahu kamu sedang berbohong."',
  '"Jangan takut untuk melangkah, tapi kalau ada lubang ya jangan masuk juga."',
  '"Kesuksesan itu berawal dari mimpi, maka dari itu jangan lupa pasang alarm."',
  '"Kalau orang lain bisa, biarlah mereka yang melakukannya."',
  '"Bekerjalah sampai saldo rekeningmu terlihat seperti nomor telepon."',
  '"Jadilah seperti kopi, tetap dicari meski pahit dan bikin deg-degan."',
  '"Deadline adalah motivasi terbaik yang pernah diciptakan manusia."',
  '"Jangan pernah menunda pekerjaan sampai besok kalau kamu bisa menundanya sampai minggu depan."',
  '"Pendidikan memang penting, tapi tahu cara mencari uang jauh lebih penting."',
  '"Kalau rencana A gagal, tenang saja, alfabet masih punya 25 huruf lainnya."',
  '"Menjadi dewasa itu seperti mengendarai sepeda, bedanya sepedanya terbakar dan kamu berada di neraka."',
  '"Hidup itu singkat, maka tersenyumlah selagi gigimu masih lengkap."',
  '"Jangan membandingkan dirimu dengan orang lain, bandingkan dengan kamu yang kemarin yang juga sama malasnya."',
  '"Kedewasaan adalah saat kamu menyadari bahwa tidur siang adalah hadiah, bukan hukuman."',
  '"Uang memang bukan segalanya, tapi segalanya jadi lebih mudah kalau ada uangnya."',
  '"Hidup itu seperti mandi air hangat; awalnya enak, lama-lama jadi keriput."',
  '"Jangan terlalu keras pada diri sendiri, kamu itu manusia, bukan aplikasi yang harus update tiap minggu."',
  '"Masalah itu seperti tamu, kalau tidak disuguhi kopi lama-lama juga pulang sendiri."',
  '"Jujur itu pahit, makanya orang lebih suka minum boba yang manis."',
  '"Kalau kamu merasa tidak berguna, ingatlah bahwa kamu masih bisa digunakan sebagai contoh yang buruk."',
  '"Motivasi hari ini: Selesaikan tugasmu sekarang agar besok bisa rebahan dengan tenang."',
  '"Berhenti mencari orang yang tepat, jadilah orang yang salah agar kamu tahu cara memperbaiki diri."',
  '"Jangan lari dari masalah, kecuali masalahnya adalah tagihan bank yang belum dibayar."',
  '"Percaya diri itu penting, tapi cek saldo ATM juga tidak kalah penting."',
  '"Kamu tidak malas, kamu hanya sedang dalam mode hemat energi untuk masa depan."',
  '"Setiap orang punya waktu masing-masing, tapi kalau telat terus ya itu namanya kebiasaan."',
  '"Jadilah diri sendiri, kecuali kalau kamu bisa jadi miliarder, jadilah miliarder."',
  '"Kesalahan adalah pengalaman, jadi kalau kamu sering salah, berarti kamu sangat berpengalaman."',
  '"Berpikir positif itu perlu, tapi sedia payung sebelum hujan itu lebih logis."',
  '"Jangan pernah menyerah pada mimpimu, lanjutkan tidurmu untuk menyelesaikannya."',
  '"Kalau kamu ingin selalu diingat orang, coba saja pinjam uang mereka."',
  '"Jangan ambil hati apa yang dikatakan orang, ambil saja hikmah dan kembaliannya."',
  '"Sahabat sejati adalah mereka yang masuk rumahmu dan langsung menuju kulkas tanpa permisi."',
  '"Cinta itu buta, tapi tetangga punya mata dan CCTV yang lebih tajam."',
  '"Hormatilah orang tuamu, karena tanpa mereka kamu tidak punya tempat mengadu saat bokek."',
  '"Jangan sombong jadi atasan, karena di atas atasan masih ada atap rumah."',
  '"Balas dendam terbaik adalah sukses dan membuat mereka bingung melihatmu."',
  '"Kalau ada yang bilang kamu jelek, sabar saja, belum tentu dia sedang bercanda."',
  '"Mendengarkan itu penting, apalagi kalau yang bicara sedang membagi-bagikan makanan gratis."',
  '"Jangan peduli apa kata orang, karena orang juga tidak akan peduli kalau kamu lapar."',
  '"Kesempatan tidak datang dua kali, tapi penyesalan sering datang berkali-kali."',
  '"Jika kamu tidak bisa meyakinkan mereka, buatlah mereka bingung dengan argumenmu."',
  '"Belajarlah dari bulu ketiak; meski selalu terhimpit, ia tetap tegar untuk tumbuh."',
  '"Hidup ini penuh dengan cobaan, kalau penuh dengan cucian itu namanya laundry."',
  '"Dompet yang kosong adalah guru terbaik tentang cara menawar harga di pasar."',
  '"Kita semua hebat, sampai kita mencoba membuka pintu tarik dengan cara didorong."',
  '"Bahagia itu sederhana: matikan alarm dan lanjut tidur kembali."',
  '"Diet selalu dimulai besok, tapi masalahnya besok tidak pernah benar-benar datang."',
  '"Tertawalah sebelum tertawa itu dilarang, atau sebelum tagihanmu datang."',
  '"Tetaplah hidup, setidaknya sampai kamu melihat akhir dari cicilan yang kamu ambil."',
];

const QUOTES_SERIUS = [
  '"Disiplin adalah jembatan antara cita-cita dan pencapaian."',
  '"Karakter seseorang diuji bukan saat ia berada di puncak, melainkan saat ia merangkak dari dasar."',
  '"Kualitas hidupmu ditentukan oleh kualitas keputusan yang kau ambil saat sedang sulit."',
  '"Kehormatan tidak ditemukan dalam kemenangan, tetapi dalam cara kita bangkit setelah kekalahan."',
  '"Jangan biarkan suara bising orang lain menenggelamkan intuisi terdalammu."',
  '"Kesuksesan bukan tentang menjadi yang terbaik, tapi tentang menjadi lebih baik dari dirimu yang kemarin."',
  '"Integritas adalah melakukan hal yang benar, bahkan ketika tidak ada satu pun orang yang melihat."',
  '"Reputasi dibangun selama bertahun-tahun, namun bisa hancur dalam hitungan detik."',
  '"Kekuatan tidak datang dari kapasitas fisik, tetapi dari kemauan yang tidak tergoyahkan."',
  '"Kedewasaan dimulai ketika kita berhenti menyalahkan orang lain atas keadaan kita sendiri."',
  '"Kegagalan adalah biaya pendidikan bagi mereka yang ingin sukses."',
  '"Rasa sakit karena disiplin jauh lebih ringan daripada rasa sakit karena penyesalan."',
  '"Pelaut yang tangguh tidak lahir di laut yang tenang."',
  '"Berhenti hanya ketika kamu sudah selesai, bukan ketika kamu merasa lelah."',
  '"Ketakutan hanyalah sebuah dinding yang memisahkanmu dari potensi tertinggimu."',
  '"Setiap luka yang kau bawa hari ini adalah bukti bahwa kau telah bertahan melampaui batasmu."',
  '"Jangan mengecilkan impianmu hanya agar sesuai dengan realitasmu saat ini."',
  '"Keberanian bukanlah ketiadaan rasa takut, melainkan keputusan bahwa ada sesuatu yang lebih penting daripada rasa takut itu sendiri."',
  '"Dunia tidak berhutang apa pun padamu; kaulah yang berhutang pada dirimu sendiri untuk berjuang."',
  '"Kesabaran bukan berarti menunggu, melainkan cara kita bersikap saat sedang berproses."',
  '"Waktu adalah mata uang paling berharga; jangan habiskan untuk membeli penyesalan."',
  '"Hidup yang tidak diperiksa tidak layak untuk dijalani."',
  '"Jangan hanya hidup untuk mengisi waktu, hiduplah untuk menciptakan jejak."',
  '"Kesunyian adalah tempat di mana kebenaran yang paling jujur sering kali terdengar."',
  '"Akhir dari sebuah perjalanan hanyalah awal dari tanggung jawab yang lebih besar."',
  '"Kebebasan sejati ditemukan dalam kendali diri, bukan dalam kepuasan nafsu."',
  '"Jadilah arsitek bagi masa depanmu, bukan tawanan bagi masa lalumu."',
  '"Kesederhanaan adalah puncak dari kerumitan yang telah berhasil ditaklukkan."',
  '"Apa yang kita lakukan hari ini adalah apa yang akan paling berarti di masa depan."',
  '"Jangan mencari kebahagiaan, carilah makna; maka kebahagiaan akan menyusul."',
  '"Visi tanpa aksi hanyalah halusinasi."',
  '"Fokuslah pada proses, dan biarkan hasil menjadi konsekuensi dari kerja kerasmu."',
  '"Jangan takut berjalan lambat, takutlah jika kamu hanya berdiri diam."',
  '"Puncak gunung yang kau lihat sekarang adalah lembah yang akan kau lalui esok hari."',
  '"Strategi tanpa eksekusi adalah jalan paling lambat menuju kemenangan."',
  '"Perubahan dimulai dari kesadaran bahwa keadaan saat ini sudah tidak lagi cukup."',
  '"Ambisi yang besar menuntut pengorbanan yang sepadan."',
  '"Dunia bergerak bagi mereka yang tahu ke mana arah tujuan mereka."',
  '"Kecerdasan tanpa moralitas adalah bahaya, namun semangat tanpa pengetahuan adalah kesia-siaan."',
  '"Investasi terbaik yang bisa kau lakukan adalah investasi pada kapasitas dirimu sendiri."',
  '"Bicaralah secukupnya agar orang mendengarkan, bertindaklah sedemikian rupa agar orang menghargai."',
  '"Kerendahan hati bukanlah berpikir kurang tentang dirimu, tapi lebih sedikit memikirkan dirimu sendiri."',
  '"Kebenaran tidak pernah takut pada pertanyaan; hanya kebohongan yang merasa terancam."',
  '"Jangan membangun kesuksesan di atas reruntuhan orang lain."',
  '"Kemarahan adalah hukuman yang kita berikan pada diri sendiri atas kesalahan orang lain."',
  '"Belajarlah untuk melepaskan apa yang tidak bisa lagi kau ubah."',
  '"Kekayaan sejati adalah saat kau memiliki hal-hal yang tidak bisa dibeli dengan uang."',
  '"Hormatilah prosesmu; tidak ada pohon besar yang tumbuh dalam semalam."',
  '"Kita tidak bisa mengubah arah angin, tapi kita bisa mengatur layar kita."',
  '"Pada akhirnya, hidupmu adalah cerita yang kau tulis sendiri. Pastikan itu layak dibaca."',
];

const QUOTES_SINDIRAN = [
  '"Bekerjalah sampai rekeningmu terlihat seperti nomor telepon, bukan seperti sisa pulsa."',
  '"Kalau mau menghina orang lain, pastikan dulu cermin di rumahmu tidak pecah."',
  '"Sangat mengagumkan melihat bagaimana kamu bisa bicara banyak tentang hal yang sama sekali tidak kamu mengerti."',
  '"Jangan terlalu sombong, kamu itu manusia, bukan aplikasi yang paling sering dicari."',
  '"Lucu ya, orang yang paling sedikit berkontribusi biasanya adalah orang yang paling keras mengeluh."',
  '"Aku tidak membencimu, aku hanya tidak suka saat kamu mulai bicara."',
  '"Ada orang yang sibuk memperbaiki diri, ada juga yang sibuk memperbaiki hidup orang lain lewat mulutnya."',
  '"Pantas saja kamu suka bicara di belakangku, posisimu memang selalu di sana."',
  '"Jangan merasa paling benar, ingatlah bahwa pensil saja punya penghapus."',
  '"Gayanya selangit, tapi kalau ditanya soal tanggung jawab mendadak hilang ingatan."',
  '"Beberapa orang seperti koin, tidak berharga tapi bermuka dua."',
  '"Terima kasih sudah mengingatkanku kenapa aku tidak pernah mengandalkanmu."',
  '"Lucu melihatmu berpura-pura peduli, aktingmu hampir mengalahkan bintang sinetron."',
  '"Jangan bangga jadi nomor satu kalau lawannya cuma dirimu sendiri yang malas."',
  '"Oksigen itu gratis, tapi sepertinya kamu tetap menyia-nyiakannya dengan bicara hal yang tidak berguna."',
  '"Iri hati itu penyakit, semoga kamu cepat sembuh ya."',
  '"Kalau mulutmu tidak bisa dijaga, setidaknya otakmu jangan dibiarkan kosong."',
  '"Bicara itu ada seninya, tapi sepertinya kamu lebih suka seni membuat orang lain kesal."',
  '"Jangan mengajari ikan cara berenang, apalagi kalau kamu sendiri cuma tahu cara mengapung."',
  '"Kamu itu seperti awan mendung, kalau hilang, harinya jadi lebih cerah."',
  '"Aku menghargai opinimu, tapi tetap saja itu salah."',
  '"Sangat sulit untuk setuju denganmu, karena kita berdua akan sama-sama salah."',
  '"Jangan terlalu sibuk mengurusi dapur orang lain sampai dapurmu sendiri tidak berasap."',
  '"Katanya mau sukses, tapi hobinya kok mengoleksi alasan."',
  '"Orang hebat bicara tentang ide, orang biasa bicara tentang kejadian, orang kecil bicara tentang orang lain."',
  '"Maaf kalau kata-kataku menyakitkan, aku tidak tahu kalau kamu sensitif soal kebenaran."',
  '"Ilmu itu dicari, bukan cuma dipajang di status media sosial."',
  '"Jadilah orang baik di dunia nyata, bukan cuma di kolom komentar."',
  '"Kalau tidak bisa membantu, setidaknya jangan jadi beban tambahan."',
  '"Beberapa orang hanya bisa menghargai sesuatu setelah mereka kehilangannya."',
  '"Kamu hebat dalam berjanji, tapi sayangnya buruk dalam menepati."',
  '"Ternyata benar, tong kosong memang nyaring bunyinya."',
  '"Berhenti bersikap seolah-olah kamu adalah korban dari situasi yang kamu buat sendiri."',
  '"Sangat mudah untuk menjadi berani kalau kamu tidak tahu apa-apa."',
  '"Jangan merasa paling pintar kalau satu-satunya buku yang kamu baca cuma buku menu."',
  '"Aku suka mendengarkan kebohonganmu saat aku sudah tahu kebenarannya."',
  '"Mungkin kamu butuh GPS supaya tahu di mana tempatmu yang sebenarnya."',
  '"Zaman sekarang, kejujuran itu barang mewah yang tidak bisa dibeli oleh orang murah."',
  '"Jangan bicara soal loyalitas kalau kamu sendiri datang hanya saat butuh."',
  '"Dunia ini sempit, jadi jangan sampai kita bertemu di saat kamu sedang butuh bantuan."',
  '"Pamer itu tanda tak mampu, tapi kamu sepertinya sangat percaya diri dengan ketidakmampuan itu."',
  '"Kamu seperti iklan di YouTube, muncul di saat yang tidak tepat dan selalu ingin dilewati."',
  '"Jangan terlalu tinggi terbangnya, nanti kalau jatuh yang sakit bukan cuma badan tapi juga harga diri."',
  '"Sibuk mencari kesalahan orang lain tidak akan membuatmu jadi benar."',
  '"Kalau kamu ingin dihormati, mulailah dengan menghormati dirimu sendiri terlebih dahulu."',
  '"Beberapa orang harus belajar bahwa diam itu tidak berbayar dan sangat menenangkan."',
  '"Kamu tidak butuh pengakuan kalau kamu memang punya kualitas."',
  '"Jangan menyalahkan kegelapan kalau kamu sendiri enggan menyalakan lilin."',
  '"Lucu sekali melihat orang yang paling tidak tahu apa-apa justru paling keras berteriak."',
  '"Hidup itu tentang pilihan, dan sepertinya kamu memilih untuk menjadi masalah."',
];

const QUOTES_MISTERIUS = [
  '"Pintu itu tidak pernah dikunci, tapi tak ada satu pun yang berani keluar."',
  '"Suara langkah kaki itu selalu berhenti tepat di depan tempat tidurmu."',
  '"Jangan menatap terlalu lama ke dalam cermin, atau kau akan melihat wajah yang bukan milikmu."',
  '"Ada satu ruangan di rumah ini yang luasnya berubah setiap kali kau berkedip."',
  '"Hutan itu menyimpan bisikan dari mereka yang tidak pernah kembali ke rumah."',
  '"Bayanganmu bergerak sedikit lebih lambat dari gerakan tubuhmu yang asli."',
  '"Setiap kali kau merasa diperhatikan, sebenarnya memang ada yang sedang menunggumu."',
  '"Dia tersenyum kepadamu, tapi matanya tetap tertuju pada sesuatu di belakangmu."',
  '"Ada nama yang jika kau sebut di tengah malam, akan mengubah arah angin secara tiba-tiba."',
  '"Kunci ini tidak membuka pintu mana pun yang bisa kau lihat sekarang."',
  '"Lampu jalan itu berkedip bukan karena rusak, tapi sebagai tanda mereka sedang lewat."',
  '"Jangan pernah menjawab panggilan suara yang terdengar mirip dengan suaramu sendiri."',
  '"Ada sebuah buku di perpustakaan tua yang mencatat setiap detail kematianmu nanti."',
  '"Keheningan malam ini terasa terlalu berat, seolah sedang menyembunyikan teriakan."',
  '"Tanah di bawah pohon itu selalu terasa hangat, meski musim dingin telah tiba."',
  '"Satu dari foto lama di dinding itu menunjukkan orang yang belum pernah lahir."',
  '"Jam dinding itu berdetak mundur satu detik setiap kali kau melakukan dosa."',
  '"Dia tidak memiliki bayangan, namun dia bisa menyentuh bayanganmu dengan dingin."',
  '"Angin malam membawa aroma bunga kamboja ke dalam kamar yang tertutup rapat."',
  '"Ada pesan tersembunyi di balik detak jantung yang kau dengar saat suasana sunyi."',
  '"Jangan biarkan tirai itu terbuka, karena langit malam sedang menatap balik."',
  '"Seseorang meninggalkan jejak kaki basah yang menuju ke dalam lemarimu."',
  '"Kau merasa sendirian, padahal ada napas halus di tengkukmu saat ini."',
  '"Sumur tua itu tidak berisi air, melainkan memori yang ingin dilupakan."',
  '"Beberapa rahasia terkubur begitu dalam hingga mereka mulai bernapas sendiri."',
  '"Suara tawa anak kecil itu berasal dari ruang bawah tanah yang sudah ditembok."',
  '"Ada sesuatu yang merayap di sela-sela pikiranmu saat kau hampir terlelap."',
  '"Lukisan itu selalu berubah posisi setiap kali kau meninggalkan ruangan."',
  '"Gagang pintu itu terasa dingin, seolah-olah ada tangan lain yang memegangnya dari sisi sana."',
  '"Jangan pernah menghitung jumlah anak tangga saat kau sendirian di rumah tua."',
  '"Cahaya lilin itu padam bukan karena ditiup, tapi karena ada yang memegangnya."',
  '"Surat itu ditulis dengan tinta yang hanya bisa dibaca oleh orang yang sudah mati."',
  '"Peta ini menunjukkan jalan menuju tempat yang sudah hilang dari sejarah."',
  '"Terkadang, pantulanmu di air terlihat lebih nyata daripada dirimu sendiri."',
  '"Ada frekuensi radio yang hanya menyiarkan suara tangisan di jam tiga pagi."',
  '"Pakaian di jemuran itu bergoyang, padahal tidak ada sedikit pun embusan angin."',
  '"Kau menemukan kunci di saku jaketmu, padahal kau belum pernah memiliki kunci itu."',
  '"Jangan menoleh jika ada yang membisikkan namamu di tengah keramaian yang sunyi."',
  '"Ada lubang kecil di dinding yang selalu tertutup setiap kali kau mencoba mengintip."',
  '"Burung gagak itu telah mengawasimu sejak kau meninggalkan ambang pintu."',
  '"Hujan ini tidak membasahi tanah, melainkan menghapus jejak-jejak masa lalu."',
  '"Ada sisa abu rokok di meja, padahal tidak ada seorang pun di rumah ini yang merokok."',
  '"Mimpi itu terasa begitu nyata karena sebenarnya itu bukan sekadar mimpi."',
  '"Seseorang sedang berdiri di pojok ruangan, tepat di titik buta matamu."',
  '"Lemari tua itu bergetar setiap kali kau menyebut kata janji."',
  '"Kau mencium bau tanah basah, padahal kau berada di lantai paling atas gedung beton."',
  '"Setiap detak jam adalah langkah kaki sesuatu yang semakin mendekat kepadamu."',
  '"Ada garis merah yang muncul di telapak tanganmu saat kau terbangun pagi ini."',
  '"Jangan pernah bertanya siapa yang menaruh koin di atas kedua matamu saat kau tidur."',
  '"Pintu keluar selalu ada di sana, tapi kau hanya tidak bisa melihatnya lagi."',
];

const QUOTE_CATEGORIES = [
  { key: "lucu", name: "Inspirasi lucu", list: QUOTES_LUCU },
  { key: "serius", name: "Inspirasi serius", list: QUOTES_SERIUS },
  { key: "sindiran", name: "Kata kata sindiran", list: QUOTES_SINDIRAN },
  { key: "misterius", name: "Kata kata misterius", list: QUOTES_MISTERIUS },
] as const;

function fmt(s: number) {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

function Index() {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;
  const [speed, setSpeed] = useState<number>(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [quote, setQuote] = useState(QUOTES_LUCU[0]);
  const [quoteCat, setQuoteCat] = useState<string>("lucu");
  const [showQuoteMenu, setShowQuoteMenu] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [tracksLoading, setTracksLoading] = useState(true);
  const [tracksError, setTracksError] = useState(false);
  const [visitors, setVisitors] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [themeIdx, setThemeIdx] = useState(0);
  const [showThemeHint, setShowThemeHint] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [bgIdx, setBgIdx] = useState(0);
  const [showSleepMenu, setShowSleepMenu] = useState(false);
  const [sleepEndsAt, setSleepEndsAt] = useState<number | null>(null);
  const [sleepRemaining, setSleepRemaining] = useState<number>(0);
  const [customMin, setCustomMin] = useState<string>("45");
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const uploadSongFn = useServerFn(uploadSong);
  const deleteSongFn = useServerFn(deleteSong);
  const renameSongFn = useServerFn(renameSong);
  const listSongsFn = useServerFn(listSongs);

  // Action menu state
  const [actionMenu, setActionMenu] = useState<Track | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Track | null>(null);
  const [renameTarget, setRenameTarget] = useState<Track | null>(null);
  const [renameInput, setRenameInput] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFiredRef = useRef(false);

  const startLongPress = (t: Track) => {
    if (!isAdmin) return;
    longPressFiredRef.current = false;
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      longPressFiredRef.current = true;
      setActionMenu(t);
    }, 550);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const filenameFromUrl = (url: string): string | null => {
    const prefix = "https://cdn.jsdelivr.net/gh/wanrifalgg/song@main/";
    if (!url.startsWith(prefix)) return null;
    try { return decodeURIComponent(url.slice(prefix.length)); } catch { return null; }
  };

  const openRename = (t: Track) => {
    setActionMenu(null);
    setRenameInput(t.title);
    setRenameTarget(t);
  };
  const openDelete = (t: Track) => {
    setActionMenu(null);
    setDeleteTarget(t);
  };

  const confirmRename = async () => {
    if (!renameTarget || !isAdmin || !adminPassword) return;
    const oldFilename = filenameFromUrl(renameTarget.url);
    if (!oldFilename) { toast.error("Lagu ini tidak bisa diganti namanya"); return; }
    const newName = renameInput.trim();
    if (!newName) { toast.error("Nama baru tidak boleh kosong"); return; }
    if (!/^[a-zA-Z0-9 ._-]+$/.test(newName)) {
      toast.error("Nama hanya boleh huruf/angka/spasi/._-");
      return;
    }
    setRenaming(true);
    try {
      const res = await renameSongFn({ data: { oldFilename, newName, adminPassword } });
      toast.success(`Diubah menjadi "${res.title}"`);
      setTracks((prev) => prev.map((x) => x.url === renameTarget.url ? { ...x, title: res.title, url: res.url } : x));
      setRenameTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mengubah nama lagu");
    } finally {
      setRenaming(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !isAdmin || !adminPassword) return;
    const filename = filenameFromUrl(deleteTarget.url);
    if (!filename) { toast.error("Lagu ini tidak bisa dihapus (URL tidak dikenali)"); return; }
    setDeleting(true);
    try {
      await deleteSongFn({ data: { filename, adminPassword } });
      toast.success(`"${deleteTarget.title}" dihapus`);
      setTracks((prev) => {
        const next = prev.filter((x) => x.url !== deleteTarget.url);
        if (idx >= next.length) setIdx(Math.max(0, next.length - 1));
        return next;
      });
      setDeleteTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menghapus lagu");
    } finally {
      setDeleting(false);
    }
  };



  // Admin state — login dengan klik logo aplikasi
  const ADMIN_STORAGE_KEY = "wanrifal_admin_pw";
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminInput, setAdminInput] = useState("");
  const [adminBusy, setAdminBusy] = useState(false);
  const [adminMsg, setAdminMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (saved) {
      setAdminPassword(saved);
      setIsAdmin(true);
    }
  }, []);

  const submitAdmin = () => {
    if (!adminInput) {
      setAdminMsg({ type: "err", text: "Masukkan password admin" });
      return;
    }
    setAdminBusy(true);
    setAdminMsg(null);
    // Validasi sebenarnya terjadi di server saat upload.
    // Di sini cukup simpan password agar tombol upload muncul.
    setTimeout(() => {
      setAdminPassword(adminInput);
      setIsAdmin(true);
      try { localStorage.setItem(ADMIN_STORAGE_KEY, adminInput); } catch { /* ignore */ }
      setAdminInput("");
      setShowAdmin(false);
      setAdminBusy(false);
      toast.success("Mode admin aktif");
    }, 200);
  };

  const doLogout = () => {
    setIsAdmin(false);
    setAdminPassword("");
    try { localStorage.removeItem(ADMIN_STORAGE_KEY); } catch { /* ignore */ }
    toast.success("Keluar dari mode admin");
  };

  const BACKGROUNDS = [
    { name: "Default", value: "" },
    { name: "Merah-Kuning", value: "linear-gradient(135deg, #ff416c 0%, #ffb347 50%, #ffd86b 100%)" },
    { name: "Ungu-Pink", value: "linear-gradient(135deg, #6a11cb 0%, #b621fe 50%, #ff5bb8 100%)" },
    { name: "Pink-Biru Muda", value: "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 40%, #a1c4fd 100%)" },
    { name: "Hijau-Biru", value: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)" },
    { name: "Sunset", value: "linear-gradient(135deg, #ff5f6d 0%, #ffc371 100%)" },
    { name: "Ocean", value: "linear-gradient(135deg, #2e3192 0%, #1bffff 100%)" },
    { name: "Galaxy", value: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)" },
    { name: "Mint-Lavender", value: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)" },
    { name: "Peach-Pink", value: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)" },
  ];
  const background = BACKGROUNDS[bgIdx];

  useEffect(() => {
    setShowSplash(true);
    const t = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => setShowThemeHint(true), 3000);
    const t2 = setTimeout(() => setShowThemeHint(false), 6000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const THEMES = [
    {
      name: "Default",
      primary: "oklch(0.78 0.16 330)",
      gradient: "linear-gradient(90deg, oklch(0.78 0.16 330), oklch(0.85 0.14 200))",
    },
    {
      name: "Pink",
      primary: "oklch(0.72 0.2 350)",
      gradient: "linear-gradient(90deg, oklch(0.78 0.2 340), oklch(0.7 0.22 360))",
    },
    {
      name: "Biru",
      primary: "oklch(0.68 0.18 240)",
      gradient: "linear-gradient(90deg, oklch(0.72 0.18 230), oklch(0.65 0.2 260))",
    },
    {
      name: "Kuning",
      primary: "oklch(0.85 0.17 90)",
      gradient: "linear-gradient(90deg, oklch(0.88 0.17 95), oklch(0.8 0.18 80))",
    },
    {
      name: "Ungu",
      primary: "oklch(0.62 0.22 300)",
      gradient: "linear-gradient(90deg, oklch(0.68 0.22 295), oklch(0.55 0.24 310))",
    },
    {
      name: "Pink-Biru",
      primary: "oklch(0.72 0.2 340)",
      gradient: "linear-gradient(90deg, oklch(0.78 0.2 340), oklch(0.82 0.14 230))",
    },
  ];
  const theme = THEMES[themeIdx];
  const themeStyle = {
    ["--primary" as string]: theme.primary,
    ["--gradient-brand" as string]: theme.gradient,
    ...(background.value ? { background: background.value } : {}),
  } as React.CSSProperties;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("https://api.counterapi.dev/v1/wanrifalremix/visits/up");
        const json = await res.json();
        if (!cancelled && typeof json?.count === "number") setVisitors(json.count);
      } catch {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, []);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const list = QUOTE_CATEGORIES.find((c) => c.key === quoteCat)?.list ?? QUOTES_LUCU;
    const pick = () => setQuote(list[Math.floor(Math.random() * list.length)]);
    pick();
    const id = setInterval(pick, 10000);
    return () => clearInterval(id);
  }, [quoteCat]);

  const loadTracksFromServer = async (): Promise<{ ok: boolean; count: number; tracks: Track[] }> => {
    const sortTracks = (arr: Track[]) =>
      arr.sort((a, b) => a.title.localeCompare(b.title, "id", { sensitivity: "base" }));

    // 1) Server function (pakai GITHUB_TOKEN, limit 5000/jam)
    try {
      const result = await listSongsFn();
      if (result.ok && result.tracks.length) {
        return {
          ok: true,
          count: result.tracks.length,
          tracks: sortTracks(result.tracks as Track[]),
        };
      }
    } catch {
      // jatuh ke fallback list.json
    }


    // 2) Fallback: list.json (mungkin rate-limit GitHub API)
    try {
      const res = await fetch(
        "https://cdn.jsdelivr.net/gh/wanrifalgg/song@main/list.json?t=" + Date.now(),
        { cache: "no-store" }
      );
      if (!res.ok) return { ok: false, count: 0, tracks: [] };
      const json: { songs?: { title: string; url: string }[] } = await res.json();
      const tracks: Track[] = (json.songs ?? []).map((s) => ({
        title: s.title,
        artist: "WanrifalRemix",
        url: s.url,
      }));
      if (!tracks.length) return { ok: false, count: 0, tracks: [] };
      return { ok: true, count: tracks.length, tracks: sortTracks(tracks) };
    } catch {
      return { ok: false, count: 0, tracks: [] };
    }
  };

  const reloadTracks = async (): Promise<{ ok: boolean; count: number }> => {
    const result = await loadTracksFromServer();
    if (result.ok) {
      setTracks(result.tracks);
      setTracksError(false);
    } else {
      setTracksError(true);
    }
    return { ok: result.ok, count: result.count };
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setTracksLoading(true);
      const result = await loadTracksFromServer();
      if (cancelled) return;
      if (result.ok) {
        setTracks(result.tracks);
        setIdx(0);
        setTracksError(false);
      } else {
        setTracksError(true);
      }
      setTracksLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) a.play().catch(() => setPlaying(false));
    else a.pause();
  }, [playing, idx]);

  // Apply playback speed (pitch & tempo synced — pitch follows speed)
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.playbackRate = speed;
    // Disable pitch preservation so pitch shifts with tempo
    type PitchAudio = HTMLAudioElement & {
      preservesPitch?: boolean;
      mozPreservesPitch?: boolean;
      webkitPreservesPitch?: boolean;
    };
    const pa = a as PitchAudio;
    pa.preservesPitch = false;
    pa.mozPreservesPitch = false;
    pa.webkitPreservesPitch = false;
  }, [speed, idx]);

  // Sleep timer: tick + auto-pause
  useEffect(() => {
    if (!sleepEndsAt) { setSleepRemaining(0); return; }
    const tick = () => {
      const ms = sleepEndsAt - Date.now();
      if (ms <= 0) {
        setSleepRemaining(0);
        setSleepEndsAt(null);
        setPlaying(false);
        const a = audioRef.current;
        if (a) a.pause();
      } else {
        setSleepRemaining(ms);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [sleepEndsAt]);

  const startSleep = (minutes: number) => {
    if (!minutes || minutes <= 0) return;
    setSleepEndsAt(Date.now() + minutes * 60 * 1000);
    setShowSleepMenu(false);
  };
  const cancelSleep = () => { setSleepEndsAt(null); setShowSleepMenu(false); };

  const handleFilePick = (f: File | null) => {
    setUploadFile(f);
    if (f && !uploadTitle) {
      setUploadTitle(f.name.replace(/\.mp3$/i, ""));
    }
  };

  const submitUpload = async () => {
    if (!isAdmin || !adminPassword) { setUploadMsg({ type: "err", text: "Mode admin tidak aktif" }); return; }
    if (!uploadFile) { setUploadMsg({ type: "err", text: "Pilih file .mp3 dulu" }); return; }
    if (!uploadFile.name.toLowerCase().endsWith(".mp3")) {
      setUploadMsg({ type: "err", text: "Hanya file .mp3 yang didukung" }); return;
    }
    if (uploadFile.size > 24 * 1024 * 1024) {
      setUploadMsg({ type: "err", text: "Ukuran maksimal 24 MB" }); return;
    }
    if (!uploadTitle.trim()) { setUploadMsg({ type: "err", text: "Judul tidak boleh kosong" }); return; }

    setUploading(true);
    setUploadMsg(null);
    try {
      const buf = await uploadFile.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(buf);
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
      }
      const contentBase64 = btoa(binary);

      const res = await uploadSongFn({
        data: {
          filename: uploadFile.name,
          title: uploadTitle.trim(),
          contentBase64,
          adminPassword,
        },
      });
      setUploadMsg({ type: "ok", text: `Berhasil! "${res.title}" ditambahkan.` });
      setUploadFile(null);
      setUploadTitle("");
      // jsDelivr cache: short delay then reload
      setTimeout(() => { reloadTracks(); }, 1500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Upload gagal";
      setUploadMsg({ type: "err", text: msg });
    } finally {
      setUploading(false);
    }
  };
  const fmtRemaining = (ms: number) => {
    const s = Math.ceil(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const next = () => {
    if (shuffle) {
      let n = idx;
      while (n === idx && tracks.length > 1) n = Math.floor(Math.random() * tracks.length);
      setIdx(n);
    } else setIdx((idx + 1) % tracks.length);
    setPlaying(true);
  };
  const prev = () => {
    setIdx((idx - 1 + tracks.length) % tracks.length);
    setPlaying(true);
  };

  const onEnded = () => {
    if (repeat) {
      const a = audioRef.current;
      if (a) {
        a.currentTime = 0;
        a.play();
      }
    } else next();
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current;
    if (!a) return;
    const t = Number(e.target.value);
    a.currentTime = t;
    setProgress(t);
  };

  const shareQuote = async () => {
    const W = 1080;
    const H = 1920;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#1a0b3d");
    bg.addColorStop(0.5, "#2d1b69");
    bg.addColorStop(1, "#0a1e3f");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Glow circles
    const g1 = ctx.createRadialGradient(W * 0.2, H * 0.15, 0, W * 0.2, H * 0.15, 600);
    g1.addColorStop(0, "rgba(236,72,153,0.45)");
    g1.addColorStop(1, "rgba(236,72,153,0)");
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, W, H);
    const g2 = ctx.createRadialGradient(W * 0.85, H * 0.85, 0, W * 0.85, H * 0.85, 700);
    g2.addColorStop(0, "rgba(56,189,248,0.4)");
    g2.addColorStop(1, "rgba(56,189,248,0)");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);

    // Quote text wrapping
    const text = quote;
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 70px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const maxWidth = W - 160;
    const words = text.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const test = line ? line + " " + w : w;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);

    const lineHeight = 96;
    const totalH = lines.length * lineHeight;
    const startY = H / 2 - totalH / 2;
    lines.forEach((ln, i) => {
      ctx.fillText(ln, W / 2, startY + i * lineHeight);
    });

    // Branding
    ctx.font = "bold 44px system-ui, sans-serif";
    ctx.fillStyle = "#7dd3fc";
    ctx.fillText("WanrifalRemix", W / 2, H - 200);
    ctx.font = "32px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText("@Wanrifalremix", W / 2, H - 140);

    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/png"));
    if (!blob) return;
    const file = new File([blob], "wanrifalremix-quote.png", { type: "image/png" });

    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.canShare && nav.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "WanrifalRemix Quote",
          text: quote,
        });
        return;
      } catch {
        /* user cancelled — fall through to download */
      }
    }

    // Fallback: download + open WhatsApp
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wanrifalremix-quote.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    window.open(
      `https://wa.me/?text=${encodeURIComponent(quote + "\n\n— WanrifalRemix")}`,
      "_blank"
    );
  };

  const current = tracks[idx] ?? tracks[0] ?? { title: "—", artist: "WanrifalRemix", url: "" };

  return (
    <div
      className={`min-h-screen w-full bg-background text-foreground flex justify-center items-stretch px-2 sm:px-4 py-3 sm:py-8 relative overflow-hidden ${isAdmin ? "admin-mode" : ""}`}
      style={themeStyle}
    >
      {showSplash && (
        <div className="splash-bg fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 px-6 text-center animate-fade-in">
          <img
            src="https://raw.githubusercontent.com/wanrifalgg/image/main/mylogo.png"
            alt="WanrifalRemix"
            className="w-28 h-28 sm:w-36 sm:h-36 object-contain drop-shadow-2xl animate-scale-in"
          />
          <h1 className="text-2xl sm:text-4xl font-bold text-white drop-shadow-lg">
            WanrifalRemix
          </h1>
          <p className="max-w-md text-base sm:text-lg italic text-white/95 drop-shadow">
            "Teruslah berkarya, karena setiap nada yang kamu ciptakan adalah jejak yang tak akan terhapus waktu."
          </p>
        </div>
      )}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 20% 0%, oklch(0.78 0.16 330 / 0.35), transparent 50%), radial-gradient(circle at 80% 100%, oklch(0.85 0.14 200 / 0.25), transparent 50%)",
        }}
      />
      <div className="w-full max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl relative flex">
        <div className="rounded-2xl sm:rounded-3xl border border-border bg-[var(--surface)]/80 backdrop-blur-xl p-3 sm:p-6 shadow-2xl w-full flex flex-col min-h-full">
          {/* Header */}
          <header className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => { if (!isAdmin) { setShowAdmin(true); setAdminInput(""); setAdminMsg(null); } }}
                className="p-0 m-0 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/40"
                title={isAdmin ? "Mode admin aktif" : "Klik untuk masuk sebagai admin"}
                aria-label="Logo WanrifalRemix"
              >
                <img src="/images/mylogo.png" alt="WanrifalRemix" className="w-11 h-11 object-contain hover:scale-105 transition" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[15px]">WanrifalRemix</span>
                  <a
                    href="https://www.youtube.com/@Wanrifalremix"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="YouTube"
                  >
                    <img src="/images/youtube.png" alt="YouTube" className="w-7 h-7 object-contain hover:scale-110 transition" />
                  </a>
                  <a
                    href="https://www.tiktok.com/@wanrifalremix?_r=1&_t=ZS-96DfKzAC2nF"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="TikTok"
                  >
                    <img src="/images/tiktok.png" alt="TikTok" className="w-7 h-7 object-contain rounded hover:scale-110 transition" />
                  </a>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                  <span>Online music player</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    {visitors !== null ? visitors.toLocaleString("id-ID") : "…"} pengunjung
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <>
                  <button
                    onClick={() => { setShowUpload(true); setUploadMsg(null); }}
                    className="p-2 rounded-full border border-primary/40 text-primary bg-primary/5 hover:scale-105 transition"
                    title="Upload lagu (admin)"
                    aria-label="Upload lagu"
                  >
                    <Upload size={16} />
                  </button>
                  <button
                    onClick={doLogout}
                    className="p-2 rounded-full border border-primary/40 text-primary bg-primary/5 hover:scale-105 transition"
                    title="Keluar mode admin"
                    aria-label="Keluar mode admin"
                  >
                    <LogOut size={16} />
                  </button>
                </>
              )}
              <div className="relative">
                <button
                  onClick={() => setShowSleepMenu((v) => !v)}
                  className={`p-2 rounded-full border text-primary bg-primary/5 hover:scale-105 transition relative ${sleepEndsAt ? "border-primary animate-pulse" : "border-primary/40"}`}
                  title={sleepEndsAt ? `Tidur dalam ${fmtRemaining(sleepRemaining)}` : "Timer tidur"}
                  aria-label="Timer tidur"
                >
                  <Moon size={16} />
                  {sleepEndsAt && (
                    <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 leading-none">
                      {fmtRemaining(sleepRemaining)}
                    </span>
                  )}
                </button>
                {showSleepMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowSleepMenu(false)} />
                    <div className="absolute right-0 top-full mt-2 z-50 min-w-[200px] rounded-xl border border-primary/30 bg-background/95 backdrop-blur-md shadow-xl p-1 animate-fade-in">
                      <p className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">Timer tidur</p>
                      {[20, 30, 60].map((m) => (
                        <button
                          key={m}
                          onClick={() => startSleep(m)}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left hover:bg-primary/10 transition"
                        >
                          <Moon size={14} className="text-primary" />
                          <span className="flex-1">{m} menit</span>
                        </button>
                      ))}
                      <div className="px-3 py-2 flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          value={customMin}
                          onChange={(e) => setCustomMin(e.target.value)}
                          placeholder="Custom"
                          className="w-16 px-2 py-1 rounded-md border border-border bg-background text-sm"
                        />
                        <span className="text-xs text-muted-foreground">menit</span>
                        <button
                          onClick={() => startSleep(Number(customMin))}
                          className="ml-auto px-2 py-1 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90"
                        >
                          Set
                        </button>
                      </div>
                      {sleepEndsAt && (
                        <>
                          <div className="my-1 h-px bg-border" />
                          <div className="px-3 py-1.5 text-xs text-muted-foreground">
                            Sisa: <span className="text-primary font-semibold">{fmtRemaining(sleepRemaining)}</span>
                          </div>
                          <button
                            onClick={cancelSleep}
                            className="w-full px-3 py-2 rounded-lg text-sm text-left hover:bg-destructive/10 text-destructive transition"
                          >
                            Batalkan timer
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => { setShowThemeMenu((v) => !v); setShowThemeHint(false); }}
                  className="p-2 rounded-full border border-primary/40 text-primary bg-primary/5 hover:scale-105 transition"
                  title={`Tema: ${theme.name}`}
                  aria-label="Ubah tema warna"
                >
                  <Palette size={16} />
                </button>
                {showThemeHint && (
                  <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 z-50 animate-fade-in pointer-events-none">
                    <div className="relative px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shadow-lg whitespace-nowrap animate-pulse">
                      Ketuk icon ini untuk mengganti tema
                      <span className="absolute left-full top-1/2 -translate-y-1/2 w-0 h-0 border-y-4 border-y-transparent border-l-4 border-l-primary" />
                    </div>
                  </div>
                )}
                {showThemeMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowThemeMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 z-50 min-w-[170px] rounded-xl border border-primary/30 bg-background/95 backdrop-blur-md shadow-xl p-1 animate-fade-in">
                      <p className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">Pilih tema</p>
                      {THEMES.map((t, i) => (
                        <button
                          key={t.name}
                          onClick={() => { setThemeIdx(i); }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left hover:bg-primary/10 transition ${i === themeIdx ? "bg-primary/15 font-semibold" : ""}`}
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                            style={{ background: t.gradient }}
                          />
                          <span className="flex-1">{t.name}</span>
                          {i === themeIdx && <span className="text-primary">✓</span>}
                        </button>
                      ))}
                      <div className="my-1 h-px bg-border" />
                      <p className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">Latar belakang</p>
                      {BACKGROUNDS.map((b, i) => (
                        <button
                          key={b.name}
                          onClick={() => { setBgIdx(i); }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left hover:bg-primary/10 transition ${i === bgIdx ? "bg-primary/15 font-semibold" : ""}`}
                        >
                          <span
                            className="w-4 h-4 rounded-md border border-white/20 shrink-0"
                            style={{ background: b.value || "var(--background)" }}
                          />
                          <span className="flex-1">{b.name}</span>
                          {i === bgIdx && <span className="text-primary">✓</span>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={shareQuote}
                className="px-4 py-2 rounded-full border border-primary/40 text-primary font-bold text-sm bg-primary/5"
                style={{ boxShadow: "var(--shadow-glow-cyan)" }}
              >
                Status
              </button>
            </div>
          </header>

          {/* Quote */}
          <div className="mt-5 relative rounded-2xl border border-border bg-[var(--surface-2)]/50 p-5 text-center min-h-[140px] flex flex-col items-center justify-center">
            <div className="absolute top-2 left-2 z-10">
              <button
                aria-label="Pilih kategori kata-kata"
                onClick={() => setShowQuoteMenu((v) => !v)}
                className="p-2 rounded-lg hover:bg-primary/10 text-foreground/80"
              >
                <Menu size={18} />
              </button>
              {showQuoteMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowQuoteMenu(false)} />
                  <div className="absolute left-0 top-full mt-1 z-50 w-56 rounded-xl border border-border bg-[var(--surface-2)] backdrop-blur-xl shadow-xl p-2 animate-fade-in">
                    <div className="px-2 py-1 text-[11px] uppercase tracking-wider text-muted-foreground">Kategori kata-kata</div>
                    {QUOTE_CATEGORIES.map((c) => (
                      <button
                        key={c.key}
                        onClick={() => { setQuoteCat(c.key); setShowQuoteMenu(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-primary/10 transition flex items-center justify-between ${c.key === quoteCat ? "bg-primary/15 font-semibold" : ""}`}
                      >
                        <span>{c.name}</span>
                        {c.key === quoteCat && <span className="text-primary">✓</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <Sparkles className="mx-auto text-primary mb-2 shrink-0" size={22} />
            <p
              className="text-[15px] font-medium leading-relaxed line-clamp-3"
              style={{
                background: "var(--gradient-brand)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {quote}
            </p>
            <button
              aria-label="Kata-kata berikutnya"
              onClick={() => {
                const list = QUOTE_CATEGORIES.find((c) => c.key === quoteCat)?.list ?? QUOTES_LUCU;
                let next = quote;
                let tries = 0;
                while (next === quote && tries < 5) {
                  next = list[Math.floor(Math.random() * list.length)];
                  tries++;
                }
                setQuote(next);
              }}
              className="absolute bottom-2 right-2 p-2 rounded-lg hover:bg-primary/10 text-foreground/80"
            >
              <SkipForward size={18} />
            </button>
          </div>

          {/* Now Playing */}
          <div className="mt-6 flex items-center gap-4">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
              style={{
                background: "var(--gradient-brand)",
                boxShadow: "var(--shadow-glow)",
              }}
            >
              {playing ? (
                <img
                  src="https://raw.githubusercontent.com/wanrifalgg/image/main/Untitled%20Project.gif"
                  alt="Now playing"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Music2 className="text-primary-foreground" size={32} />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold truncate">{current.title}</h2>
              <p className="text-muted-foreground text-sm">{current.artist}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-5">
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={progress}
              onChange={seek}
              className="w-full accent-primary h-1 cursor-pointer"
              style={{
                background: `linear-gradient(to right, oklch(0.85 0.14 200) 0%, oklch(0.85 0.14 200) ${
                  duration ? (progress / duration) * 100 : 0
                }%, oklch(0.3 0.04 275) ${duration ? (progress / duration) * 100 : 0}%, oklch(0.3 0.04 275) 100%)`,
                borderRadius: 999,
                appearance: "none",
              }}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>{fmt(progress)}</span>
              <span>{fmt(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-5 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShuffle(!shuffle)}
                className={`p-2 transition ${shuffle ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Shuffle size={20} />
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowSpeedMenu((v) => !v)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition ${
                    speed !== 1
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Kecepatan pemutaran"
                  aria-label="Kecepatan pemutaran"
                >
                  <Gauge size={18} />
                  <span className="text-[10px] leading-none">{speed}x</span>
                </button>
                {showSpeedMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowSpeedMenu(false)}
                    />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 bg-popover border border-border rounded-xl shadow-lg p-1.5 flex flex-col min-w-[88px]">
                      {SPEED_OPTIONS.map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            setSpeed(s);
                            setShowSpeedMenu(false);
                          }}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition text-center ${
                            speed === s
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground hover:bg-muted"
                          }`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={prev} className="text-foreground hover:scale-110 transition">
                <SkipBack size={26} fill="currentColor" />
              </button>
              <button
                onClick={() => setPlaying(!playing)}
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: "var(--gradient-brand)",
                  boxShadow: "var(--shadow-glow)",
                }}
              >
                {playing ? (
                  <Pause className="text-primary-foreground" size={28} fill="currentColor" />
                ) : (
                  <Play className="text-primary-foreground ml-1" size={28} fill="currentColor" />
                )}
              </button>
              <button onClick={next} className="text-foreground hover:scale-110 transition">
                <SkipForward size={26} fill="currentColor" />
              </button>
            </div>
            <button
              onClick={() => setRepeat(!repeat)}
              className={`p-2 transition ${repeat ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Repeat size={20} />
            </button>
          </div>

          {/* Playlist */}
          <div className="mt-7">
            <div className="flex items-center justify-end mb-2">
              <button
                onClick={async () => {
                  if (refreshing) return;
                  setRefreshing(true);
                  try {
                    const result = await reloadTracks();
                    if (result.ok) {
                      toast.success(`Playlist berhasil diperbarui (${result.count} lagu)`);
                    } else {
                      toast.error("Gagal memuat playlist. Coba lagi.");
                    }
                  } finally { setRefreshing(false); }
                }}
                disabled={refreshing}
                title="Refresh playlist"
                className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11px] font-semibold bg-[var(--surface-2)]/60 border border-border hover:border-primary/60 hover:text-primary transition-colors disabled:opacity-60"
              >
                <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-xs font-bold tracking-[0.2em] text-muted-foreground shrink-0">
                PLAYLIST ({tracks.length})
              </h3>
              <div className="relative flex-1 min-w-0">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari judul lagu..."
                  className="w-full h-8 pl-8 pr-3 rounded-full text-xs bg-[var(--surface-2)]/60 border border-border focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <ul className="space-y-2 max-h-[22rem] overflow-y-auto pr-1 themed-scroll">
              {tracks
                .map((t, i) => ({ t, i }))
                .filter(({ t }) =>
                  t.title.toLowerCase().includes(search.trim().toLowerCase())
                )
                .map(({ t, i }) => {
                const active = i === idx;
                return (
                  <li
                    key={t.url}
                    onClick={() => {
                      if (longPressFiredRef.current) { longPressFiredRef.current = false; return; }
                      setIdx(i);
                      setPlaying(true);
                    }}
                    onContextMenu={(e) => {
                      if (!isAdmin) return;
                      e.preventDefault();
                      setActionMenu(t);
                    }}
                    onPointerDown={() => startLongPress(t)}
                    onPointerUp={cancelLongPress}
                    onPointerLeave={cancelLongPress}
                    onPointerCancel={cancelLongPress}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition select-none ${
                      active
                        ? "border border-primary/50 bg-primary/5"
                        : "border border-transparent hover:bg-[var(--surface-2)]/50"
                    }`}
                  >
                    <span className="w-6 text-xs text-muted-foreground tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm truncate ${active ? "text-primary" : ""}`}>
                        {t.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{t.artist}</p>
                    </div>
                    {active && playing && (
                      <div className="flex items-end gap-0.5 h-5">
                        {[0, 1, 2, 3].map((b) => (
                          <span
                            key={b}
                            className="w-0.5 bg-accent rounded-full"
                            style={{ animation: `eq 0.9s ease-in-out ${b * 0.15}s infinite` }}
                          />
                        ))}
                      </div>
                    )}
                    <a
                      href={t.url}
                      download={`${t.title}.mp3`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 text-primary hover:scale-110 transition"
                      aria-label={`Download ${t.title}`}
                    >
                      <Download size={20} />
                    </a>
                  </li>
                );
              })}
              {tracksLoading && tracks.length === 0 && (
                <li className="text-center text-xs text-muted-foreground py-6">
                  Memuat playlist...
                </li>
              )}
              {!tracksLoading && tracksError && tracks.length === 0 && (
                <li className="text-center text-xs text-destructive py-6">
                  Gagal memuat playlist. Tekan tombol Refresh untuk mencoba lagi.
                </li>
              )}
              {!tracksLoading && !tracksError && tracks.filter((t) =>
                t.title.toLowerCase().includes(search.trim().toLowerCase())
              ).length === 0 && (
                <li className="text-center text-xs text-muted-foreground py-6">
                  Tidak ada lagu ditemukan
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <audio
        ref={audioRef}
        {...(current.url ? { src: current.url } : {})}
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={onEnded}
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes eq {
          0%, 100% { height: 20%; }
          50% { height: 100%; }
        }
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: oklch(0.85 0.14 200);
          box-shadow: 0 0 10px oklch(0.85 0.14 200 / 0.7);
          cursor: pointer;
        }
        .themed-scroll {
          scrollbar-width: thin;
          scrollbar-color: oklch(0.78 0.16 280) transparent;
        }
        .themed-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .themed-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .themed-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, oklch(0.85 0.14 200), oklch(0.78 0.16 290));
          border-radius: 999px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        .themed-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, oklch(0.88 0.14 200), oklch(0.82 0.18 290));
          background-clip: padding-box;
        }
      `}</style>

      {showUpload && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="absolute inset-0" onClick={() => !uploading && setShowUpload(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-primary/30 bg-background shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Upload size={18} className="text-primary" />
                Upload Lagu Baru
              </h2>
              <button
                onClick={() => !uploading && setShowUpload(false)}
                className="p-1 rounded-full hover:bg-muted transition"
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-muted-foreground">File MP3 (maks 24 MB)</label>
                <input
                  type="file"
                  accept="audio/mpeg,.mp3"
                  onChange={(e) => handleFilePick(e.target.files?.[0] ?? null)}
                  disabled={uploading}
                  className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:text-xs file:font-semibold hover:file:opacity-90"
                />
                {uploadFile && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {uploadFile.name} — {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-muted-foreground">Judul lagu</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  disabled={uploading}
                  placeholder="Nama lagu yang ditampilkan"
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
                />
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <ShieldCheck size={12} className="text-primary" /> Mode <span className="font-semibold text-foreground">Admin</span>
              </p>
              {uploadMsg && (
                <div className={`text-xs px-3 py-2 rounded-md ${uploadMsg.type === "ok" ? "bg-green-500/10 text-green-500 border border-green-500/30" : "bg-destructive/10 text-destructive border border-destructive/30"}`}>
                  {uploadMsg.text}
                </div>
              )}
              <button
                onClick={submitUpload}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-60 transition"
              >
                {uploading ? <><Loader2 size={16} className="animate-spin" /> Mengupload...</> : <><Upload size={16} /> Upload ke GitHub</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="absolute inset-0" onClick={() => !adminBusy && setShowAdmin(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-primary/30 bg-background shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <ShieldCheck size={18} className="text-primary" />
                Login Admin
              </h2>
              <button onClick={() => !adminBusy && setShowAdmin(false)} className="p-1 rounded-full hover:bg-muted transition" aria-label="Tutup">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Masukkan password admin untuk mengaktifkan tombol upload lagu.
              </p>
              <div>
                <label className="block text-xs font-semibold mb-1 text-muted-foreground">Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    value={adminInput}
                    onChange={(e) => setAdminInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !adminBusy) submitAdmin(); }}
                    disabled={adminBusy}
                    autoFocus
                    placeholder="Password admin"
                    className="w-full pl-8 pr-3 py-2 rounded-md border border-border bg-background text-sm"
                  />
                </div>
              </div>
              {adminMsg && (
                <div className={`text-xs px-3 py-2 rounded-md ${adminMsg.type === "ok" ? "bg-green-500/10 text-green-500 border border-green-500/30" : "bg-destructive/10 text-destructive border border-destructive/30"}`}>
                  {adminMsg.text}
                </div>
              )}
              <button
                onClick={submitAdmin}
                disabled={adminBusy}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-60 transition"
              >
                {adminBusy ? <><Loader2 size={16} className="animate-spin" /> Memproses...</> : <><ShieldCheck size={16} /> Masuk sebagai Admin</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {actionMenu && (
        <div className="fixed inset-0 z-[105] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="absolute inset-0" onClick={() => setActionMenu(null)} />
          <div className="relative w-full max-w-xs rounded-2xl border border-primary/30 bg-background shadow-2xl p-2">
            <div className="px-3 pt-2 pb-3 border-b border-border">
              <p className="text-xs text-muted-foreground">Aksi admin</p>
              <p className="text-sm font-bold truncate">{actionMenu.title}</p>
            </div>
            <button
              onClick={() => openRename(actionMenu)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm hover:bg-primary/10 transition text-left"
            >
              <Pencil size={16} className="text-primary" />
              Ganti nama
            </button>
            <button
              onClick={() => openDelete(actionMenu)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm hover:bg-destructive/10 transition text-left text-destructive"
            >
              <Trash2 size={16} />
              Hapus
            </button>
          </div>
        </div>
      )}

      {renameTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="absolute inset-0" onClick={() => !renaming && setRenameTarget(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-primary/40 bg-background shadow-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold flex items-center gap-2 text-primary">
                <Pencil size={18} /> Ganti Nama Lagu
              </h2>
              <button onClick={() => !renaming && setRenameTarget(null)} className="p-1 rounded-full hover:bg-muted transition" aria-label="Tutup">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Nama file di GitHub akan ikut berubah menjadi <span className="font-mono">{(renameInput.trim() || "...")}.mp3</span>
            </p>
            <input
              type="text"
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !renaming) confirmRename(); }}
              disabled={renaming}
              autoFocus
              placeholder="Nama baru (tanpa .mp3)"
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => !renaming && setRenameTarget(null)}
                disabled={renaming}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border hover:bg-muted text-sm font-semibold transition disabled:opacity-60"
              >
                Batal
              </button>
              <button
                onClick={confirmRename}
                disabled={renaming}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-60 transition"
              >
                {renaming ? <><Loader2 size={16} className="animate-spin" /> Mengubah...</> : <><Pencil size={16} /> Simpan</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="absolute inset-0" onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-destructive/40 bg-background shadow-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold flex items-center gap-2 text-destructive">
                <Trash2 size={18} /> Hapus Lagu
              </h2>
              <button onClick={() => !deleting && setDeleteTarget(null)} className="p-1 rounded-full hover:bg-muted transition" aria-label="Tutup">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Yakin ingin menghapus <span className="font-semibold text-foreground">"{deleteTarget.title}"</span>? File akan dihapus permanen dari repository GitHub.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => !deleting && setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border hover:bg-muted text-sm font-semibold transition disabled:opacity-60"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-destructive text-destructive-foreground font-semibold hover:opacity-90 disabled:opacity-60 transition"
              >
                {deleting ? <><Loader2 size={16} className="animate-spin" /> Menghapus...</> : <><Trash2 size={16} /> Hapus</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
