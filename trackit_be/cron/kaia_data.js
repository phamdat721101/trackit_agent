const cron = require('node-cron');
const puppeteer = require('puppeteer');
const fs = require('fs');
const { format } = require('date-fns');

// Function to scrape Kaia token APR
async function scrapeKaiaAPR() {
    try {
        // Launch a headless browser
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        // Navigate to the DeFi platform page
        await page.goto('https://dex.capybara.exchange/en/pool', { waitUntil: 'networkidle2' });

        // Extract the APR for the Kaia token
        const kaiaAPR = await page.evaluate(() => {
            // Find the element containing the text "Kaia"
            const kaiaElement = Array.from(document.querySelectorAll('*')).find(element => 
                element.innerText.includes('Kaia')
            );

            if (kaiaElement) {
                // Locate the APR value near the Kaia token (update the logic based on the website structure)
                const aprElement = kaiaElement.closest('div').querySelector('.apr'); // Example selector
                return aprElement ? aprElement.innerText.trim() : 'APR not found';
            } else {
                return 'Kaia token not found';
            }
        });

        console.log('Kaia Token APR:', kaiaAPR);

        // Save the APR data to a file (optional)
        fs.appendFileSync('kaia_apr_data.txt', `Kaia Token APR on ${new Date().toISOString()}: ${kaiaAPR}\n`);

        // Close the browser
        await browser.close();
    } catch (error) {
        console.error('Error during scraping:', error);
    }
}

// Schedule the scraping task to run daily at 8:00 AM
cron.schedule('* * * * *', () => {
    console.log('Running the scraping task...');
    scrapeKaiaAPR();
});

console.log('Cron job scheduled. Waiting for the next run...');