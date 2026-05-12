# Setup Gambar untuk Landing Page

## Langkah-langkah untuk menambahkan 2 gambar animasi di Landing Page:

### 1. Upload Gambar ke Assets Folder
Simpan 2 gambar PNG ke folder `src/assets/` dengan nama:
- **`sikak-concept-1.png`** - Gambar pertama (konsep SIKAK - data recording)
- **`sikak-concept-2.png`** - Gambar kedua (konsep SIKAK - digitalisasi asuhan)

### 2. Update Import di LandingPage.tsx
Buka file `src/pages/LandingPage.tsx` dan tambahkan import setelah import logo yang ada:

```typescript
import sikakConcept1 from "@/assets/sikak-concept-1.png";
import sikakConcept2 from "@/assets/sikak-concept-2.png";
```

### 3. Update Image References
Di bagian animasi carousel (sekitar baris 180-191), update `src` attribute dari:

```jsx
// Dari ini:
<img src={sikakLogo} alt="SIKAK Konsep 1" className="h-64 w-64 object-contain" />
<img src={sikakLogo} alt="SIKAK Konsep 2" className="h-64 w-64 object-contain" />

// Menjadi ini:
<img src={sikakConcept1} alt="SIKAK Konsep 1" className="h-64 w-64 object-contain" />
<img src={sikakConcept2} alt="SIKAK Konsep 2" className="h-64 w-64 object-contain" />
```

## Detail Fitur Baru:

✅ **Hero Section**: Dihapus animasi carousel, hanya text yang tetap  
✅ **Section Baru "Tentang SIKAK"**: Menampilkan:
- **Kiri**: Animasi 2 gambar dengan durasi 4 detik, auto-loop
- **Kanan**: 4 card deskripsi (Pengertian, Pendekatan, Mengapa Dibutuhkan, Keunggulan)

✅ **Animasi**: Smooth transition dengan duration 500ms, indicator dots di bawah gambar

## Preview Struktur HTML:
```
<section>
  <div className="grid grid-cols-1 md:grid-cols-2">
    <!-- Kiri: Carousel Gambar -->
    <div>Animated Images (4 second duration)</div>
    
    <!-- Kanan: Deskripsi SIKAK -->
    <div>
      <h3>Apa itu SIKAK?</h3>
      <card>Pengertian</card>
      <card>Pendekatan</card>
      <card>Mengapa Dibutuhkan</card>
      <card>Keunggulan</card>
    </div>
  </div>
</section>
```
