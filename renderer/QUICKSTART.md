#QUICK START -Inventory System

## For Windows Users (Easiest Method)

### First Time Setup:
1. **Install Node.js** (if not already installed)
   - Go to: https://nodejs.org/
   - Download and install the LTS version
   - Restart your computer

2. **Double-click `run-app.bat`**
   - First run will install dependencies (2-3 minutes)
   - App will launch automatically

3. **Done!** The app is now ready to use.

### Every Time After:
- Just double-click `run-app.bat` to start the app

---

## For Mac/Linux Users

### First Time Setup:
1. **Install Node.js** (if not already installed)
   - Go to: https://nodejs.org/
   - Download and install the LTS version

2. **Open Terminal in this folder**
   - Right-click folder â†’ "Open in Terminal"
   - Or: `cd /path/to/medical-inventory-system`

3. **Run the app:**
   ```bash
   ./run-app.sh
   ```
   - First run will install dependencies (2-3 minutes)
   - App will launch automatically

### Every Time After:
```bash
./run-app.sh
```

---

## Using VSCode (All Platforms)

### First Time:
1. Open VSCode
2. `File` â†’ `Open Folder` â†’ Select this folder
3. `Terminal` â†’ `New Terminal` (or press `Ctrl+~`)
4. Type: `npm install` (press Enter)
5. Wait for installation to complete
6. Type: `npm start` (press Enter)

### Every Time After:
1. Open folder in VSCode
2. Press `Ctrl+~` to open terminal
3. Type: `npm start`

---

## Creating a Standalone .EXE (Windows)

Want an executable file you can run without VSCode?

1. Open folder in VSCode
2. Open terminal (`Ctrl+~`)
3. Type: `npm run build-win`
4. Wait 5-10 minutes
5. Find your `.exe` in the `dist/` folder
6. You can now run it without VSCode!

---

## Verify Installation

After running the app, you should see:
- “ A new window opens (not in browser)
- “ "Medical Supply Office Inventory System" title
- “ Menu bar with File, Edit, View, Help
- “ Forms to add and reduce items
- “ Statistics dashboard at the top

---

##  Troubleshooting

**"npm is not recognized"** Install Node.js from https://nodejs.org/

**App won't start** Delete `node_modules` folder, then run `npm install` again

**Window is blank** Press `Ctrl+Shift+I` to open developer tools and check for errors

**Data not saving** Check that you're not running in a read-only folder

---

## Where is My Data Stored?

Your inventory data is automatically saved to:
- **Windows:** `C:\Users\YourName\AppData\Roaming\medical-inventory-system\`
- **Mac:** `~/Library/Application Support/medical-inventory-system/`
- **Linux:** `~/.config/medical-inventory-system/`

Data persists even if you close the app or restart your computer!
Use the "Create Full Backup" button regularly to download a JSON file of all your data. This way you can restore it if anything happens!
---

## Using the App

### Add Items:
1. Fill in the "Add New Item" form
2. Click "Add Item"
3. Data saves automatically

### Reduce Inventory:
1. Use "Reduce Item Quantity" form
2. Select item, enter quantity and details
3. Click "Reduce Quantity"

### Export Data:
1. Scroll to "Export & Backup" section
2. Click your preferred format:
   - Excel (CSV) - for spreadsheets
   - PDF - for reports
   - JSON - for backup

### Create Backup:
1. Click "Create Full Backup"
2. Save the file somewhere safe
3. Use "Import Backup" to restore later

---

## Need Help?

1. Read `INSTALLATION.md` for detailed instructions
2. Read `README.md` for feature documentation
3. Check Node.js is installed: `node --version`
4. Check npm is installed: `npm --version`

---

## Commands Reference

```bash
npm install          # Install dependencies (first time only)
npm start           # Run the app
npm run build-win   # Create Windows executable
npm run build-mac   # Create Mac application
npm run build-linux # Create Linux application
```

---

**That's it! You're ready to run the inventory!** 
