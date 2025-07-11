# Warna Text
GREEN="\e[32m"
YELLOW="\e[33m"
CYAN="\e[36m"
RESET="\e[0m"

# Kamu juga bisa setting ke spesifik versi 
# Example : 
# VERSION="v/1.0.0"
VERSION="latest"

# Step 1: Clone repository
echo -e "${CYAN} Cloning dropio repository...${RESET}"
git clone https://github.com/WeebzDev/dropio.git

# Step 2: Buat folder untuk library dropio
echo -e "${YELLOW} Membuat folder ./src/lib/dropio...${RESET}"
mkdir -p ./src/lib/dropio
echo -e "${GREEN} Berhasil Membuat Folder Lib.${RESET}"

# Step 3: Salin file library dropio
echo -e "${YELLOW} Menyalin file lib/dropio...${RESET}"
cp -r "./dropio/template/nextjs-app/${VERSION}/lib/dropio/*" ./src/lib/dropio
echo -e "${GREEN} Berhasil Menyalin File Lib.${RESET}"

# Step 4: Buat folder untuk API dropio
echo -e "${YELLOW} Membuat folder ./src/app/api/dropio...${RESET}"
mkdir -p ./src/app/api/dropio
echo -e "${GREEN} Berhasil Membuat Folder Api.${RESET}"

# Step 5: Salin file API dropio
echo -e "${YELLOW} Menyalin file api/dropio...${RESET}"
cp -r "./dropio/template/nextjs-app/${VERSION}/api/dropio/*" ./src/app/api/dropio
echo -e "${GREEN} Berhasil Menyalin File Api.${RESET}"

# Step 6: Buat folder utils
echo -e "${YELLOW} Membuat folder ./src/utils...${RESET}"
mkdir -p ./src/utils
echo -e "${GREEN} Berhasil Membuat Folder Utils.${RESET}"

# Step 7: Salin file utils
echo -e "${YELLOW} Menyalin file utils...${RESET}"
cp -r "./dropio/template/nextjs-app/${VERSION}/utils/*" ./src/utils
echo -e "${GREEN} Berhasil Menyalin File Utils.${RESET}"

# Step 8: Hapus folder dropio
echo -e "${CYAN} Menghapus folder ./dropio...${RESET}"
rm -rf ./dropio

# Selesai
echo -e "${GREEN} Selesai. Emang semudah itu untuk setup dropio :3${RESET}"
echo -e "${GREEN} Contoh Component : https://docs.dropio.my.id/docs/getting-started/frameworks/nextjs-app-router#example.${RESET}"
