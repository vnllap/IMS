#Supply Office Inventory System

A simple inventory management system for the supplies office with persistent data storage and export capabilities.
NOTE:::: Use the "Create Full Backup" button regularly (every week/month) to download a JSON file of all your data. This way you can be sure to have a backup of the records.
## Files Structure

- **index.html** - Main HTML structure
- **styles.css** - All styling and CSS
- **script.js** - All JavaScript functionality

## ¨Features

### 1. Separated Files
  All HTML, CSS and JavaScript code are separate files for better organization and maintainability.

### 2. Export Functionality
  #### Excel Export (CSV)
  - Exports both inventory and transactions to a CSV file
  - Can be opened in Excel, Google Sheets, or any spreadsheet application
  - Includes headers and formatted data
  - File naming: `medical-inventory-YYYY-MM-DD.csv`

  #### PDF Export
  - Opens a print-friendly view in a new window
  - Includes summary statistics, inventory table, and recent transactions
  - Use browser's Print function and select "Save as PDF"
  - Formatted for professional reports

  #### JSON Export
  - Exports raw data in JSON format
  - Useful for data backup or importing into other systems
  - File naming: `medical-inventory-YYYY-MM-DD.json`

### 3. Backup & Restore

  #### Full Backup
  - Creates a complete backup of all inventory and transaction data
  - Includes timestamp and version information
  - File naming: `medical-inventory-backup-YYYY-MM-DD.json`

  #### Import Backup
  - Restore data from a previously created backup file
  - Replaces all current data (confirmation required)
  - Compatible with JSON backup files

### 4. Persistent Data Storage

  #### LocalStorage Implementation
  - All data is automatically saved to browser's localStorage
  - Data persists even after:
    - Closing the browser
    - Restarting the computer
    - Clearing browsing history (in most browsers)
  
  #### Data Saved:
  - Complete inventory list
  - All transaction history
  - Automatically saves on every change

  #### Important Note:
  - Data is stored locally in your browser
  - Each browser maintains its own storage
  - Clearing browser data/cache may delete localStorage
  - **Regular backups are recommended** for important data

## How to Use 

### Setup
1. Keep all three files in the same folder:
   - index.html
   - styles.css
   - script.js

2. Open `index.html` in your web browser

### Adding Items
1. Fill in the "Add New Item" form
2. All fields marked with * are required
3. Click "Add Item" button
4. Data is automatically saved

### Reducing Inventory
1. Use the "Reduce Item Quantity" form
2. Select item from dropdown
3. Enter quantity and recipient details
4. Click "Reduce Quantity"
5. Transaction is recorded automatically

### Quick Actions
From the inventory table, you can:
- **+ Add**: Quick add to item quantity
- **- Reduce**: Quick reduce with prompts
- **View**: See detailed item information
- **Delete**: Remove item from inventory

### Exporting Data

#### For Excel/Spreadsheet:
1. Click Export to Excel (CSV)"
2. Open the downloaded file in Excel or Google Sheets

#### For PDF Reports:
1. Click Export to PDF"
2. In the new window, click "Print / Save as PDF"
3. Select "Save as PDF" from your browser's print dialog

#### For Backup:
1. Click Create Full Backup"
2. Save the JSON file in a safe location
3. Use "Import Backup" to restore later


## Data Persistence Details

### What's Saved:
- All inventory items with their properties
- Complete transaction history
- Timestamps for all actions

### When It's Saved:
- After adding new items
- After reducing quantities
- After deleting items
- After any modification

### Data Recovery:
If you lose data:
1. Check if you have a backup file
2. Use "Import Backup" to restore
3. If no backup exists, data recovery may not be possible (try to save a backup every week or better everyday if you have new entries for the day)

## Data Security

- Data is stored locally in your browser
- No data is sent to external servers
- Use backups for long-term data security
- Consider creating regular backups (daily/weekly/monthly)

## Statistics Dashboard

The system tracks:
- **Total Items**: Number of unique items
- **Total Quantity**: Sum of all quantities
- **Low Stock**: Items at or below minimum quantity
- **Out of Stock**: Items with zero quantity

## Important Reminders

1. **Create Regular Backups**: Use the backup feature frequently
2. **Browser Compatibility**: Works best in modern browsers (Chrome, Brave, Firefox, Edge, Safari, etc.)
3. **Private/Incognito Mode**: Data DOES NOT persist in private browsing
4. **Multiple Browsers**: Each browser stores data separately - it is best to have it only on one machine to prevent confusion

## Troubleshooting

### Data Not Saving
- Check if localStorage is enabled in your browser
- Ensure you're not in private/incognito mode
- Check browser console for errors (F12)

### Export Not Working
- Allow pop-ups for this page
- Check browser's download settings
- Ensure sufficient disk space

### Import Backup Failed
- Verify the backup file is a valid JSON file
- Check that the file was created by this system - does not accept any other file that was not created by the same system
- Try creating a new backup and importing it

## License

Free to use and modify.

## Support 

For issues or questions, contact Jeff through:
Email: paisjeff8@gmail.com
Mobile/Telegram: +63 951 599 5205
Facebook: Jeff Pais

---

**Version**: 4.20  
**Last Updated**: February 2026
