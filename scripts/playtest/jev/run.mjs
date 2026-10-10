const args=process.argv.slice(2);if(args.includes('--mock'))process.env.BILL_BRAWL_JEV_MODE='mock';
const defaults=[];if(!args.includes('--decisions'))defaults.push('--decisions','10');if(!args.includes('--out'))defaults.push('--out','artifacts/jev-browser');
process.argv=[process.argv[0],new URL('../browser.mjs',import.meta.url).pathname,'--driver',new URL('./driver.mjs',import.meta.url).pathname,...defaults,...args.filter(a=>a!=='--mock')];
await import('../browser.mjs');
