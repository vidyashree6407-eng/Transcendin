#!/usr/bin/env node

/**
 * ENROLLMENT SYSTEM TEST HELPER
 * 
 * This script helps verify your enrollment system setup
 * Usage: node test-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n' + '='.repeat(70));
console.log('  ENROLLMENT SYSTEM - SETUP VERIFICATION');
console.log('='.repeat(70) + '\n');

// ============================================================================
// 1. CHECK NODE VERSION
// ============================================================================

console.log('1️⃣  NODE VERSION');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion >= 14) {
    console.log(`   ✅ Node ${nodeVersion} (OK - requires v14+)\n`);
} else {
    console.log(`   ❌ Node ${nodeVersion} (FAIL - requires v14+)\n`);
}

// ============================================================================
// 2. CHECK FILES EXIST
// ============================================================================

console.log('2️⃣  REQUIRED FILES');
const requiredFiles = [
    'enrollment.html',
    'enrollment.js',
    'enrollment-styles.css',
    'server.js',
    'courses.js',
    'package.json',
    'c_c.csv'
];

const missingFiles = [];
requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        console.log(`   ✅ ${file} (${stat.size} bytes)`);
    } else {
        console.log(`   ❌ ${file} (MISSING)`);
        missingFiles.push(file);
    }
});
console.log('');

// ============================================================================
// 3. CHECK DIRECTORIES EXIST
// ============================================================================

console.log('3️⃣  REQUIRED DIRECTORIES');
const requiredDirs = [
    'data',
    'data/enrollments',
    'assets'
];

requiredDirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (fs.existsSync(dirPath)) {
        console.log(`   ✅ ${dir}/`);
    } else {
        console.log(`   ❌ ${dir}/ (MISSING)`);
    }
});
console.log('');

// ============================================================================
// 4. CHECK .ENV FILE
// ============================================================================

console.log('4️⃣  ENVIRONMENT CONFIGURATION');
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (fs.existsSync(envPath)) {
    console.log('   ✅ .env file exists');
    
    // Check if env variables are set
    require('dotenv').config();
    const required = [
        'PAYPAL_CLIENT_ID',
        'PAYPAL_CLIENT_SECRET',
        'SMTP_HOST',
        'SMTP_USER',
        'SMTP_PASS'
    ];
    
    let allSet = true;
    required.forEach(key => {
        if (process.env[key] && process.env[key] !== `your_${key.toLowerCase()}`) {
            console.log(`      ✅ ${key} is set`);
        } else {
            console.log(`      ❌ ${key} is NOT set or is placeholder`);
            allSet = false;
        }
    });
    
    if (allSet) {
        console.log('   ✅ All required environment variables are configured\n');
    } else {
        console.log('   ⚠️  Some environment variables are missing!\n');
    }
} else {
    console.log('   ❌ .env file NOT found');
    if (fs.existsSync(envExamplePath)) {
        console.log('   ℹ️  Copy .env.example to .env and fill in your credentials\n');
    } else {
        console.log('   ❌ .env.example also not found\n');
    }
}

// ============================================================================
// 5. CHECK PACKAGE.JSON DEPENDENCIES
// ============================================================================

console.log('5️⃣  NPM DEPENDENCIES');
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const required = [
        'express',
        'cors',
        'helmet',
        'nodemailer',
        'express-validator',
        'express-rate-limit'
    ];
    
    const nodeModulesPath = path.join(__dirname, 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
        console.log('   ✅ node_modules/ exists (npm install completed)');
        let allInstalled = true;
        required.forEach(dep => {
            if (pkg.dependencies[dep]) {
                console.log(`      ✅ ${dep} ${pkg.dependencies[dep]}`);
            } else {
                console.log(`      ❌ ${dep} (NOT in package.json)`);
                allInstalled = false;
            }
        });
    } else {
        console.log('   ❌ node_modules/ NOT found');
        console.log('   ℹ️  Run: npm install\n');
    }
} else {
    console.log('   ❌ package.json not found\n');
}
console.log('');

// ============================================================================
// 6. CHECK CSV DATA
// ============================================================================

console.log('6️⃣  COURSE DATA (CSV)');
const csvPath = path.join(__dirname, 'c_c.csv');
if (fs.existsSync(csvPath)) {
    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split('\n');
    const header = lines[0];
    
    console.log(`   ✅ c_c.csv exists (${lines.length} total lines)`);
    
    if (header.includes('Price')) {
        console.log('   ✅ Price column exists in CSV');
    } else {
        console.log('   ❌ Price column NOT found in CSV');
    }
    
    console.log(`   ℹ️  Sample header: ${header.substring(0, 80)}...\n`);
} else {
    console.log('   ❌ c_c.csv not found\n');
}

// ============================================================================
// 7. PAYPAL TEST ACCOUNT INFO
// ============================================================================

console.log('7️⃣  PAYPAL TEST CREDENTIALS');
console.log('   📝 Create sandbox buyer and seller accounts in the PayPal Developer Dashboard.');
console.log('      The PayPal button uses the sandbox accounts when PAYPAL_ENV=sandbox.\n');

// ============================================================================
// 8. QUICK START COMMANDS
// ============================================================================

console.log('8️⃣  QUICK START');
console.log('   Terminal 1 (Backend):');
console.log('      $ node server.js\n');
console.log('   Terminal 2 (Frontend):');
console.log('      $ python -m http.server 8000\n');
console.log('   Browser:');
console.log('      → http://localhost:8000/courses.html\n');

// ============================================================================
// 9. ENROLLMENT FLOW
// ============================================================================

console.log('9️⃣  ENROLLMENT FLOW');
console.log('   1. Click "Enroll Now" on any course');
console.log('   2. Fill in your details (validation included)');
console.log('   3. Review and confirm details');
    console.log('   4. Complete payment via PayPal');
console.log('   5. See confirmation with enrollment ID');
console.log('   6. Receive confirmation email\n');

// ============================================================================
// 10. SUMMARY
// ============================================================================

console.log('='.repeat(70));
console.log('  SUMMARY');
console.log('='.repeat(70) + '\n');

if (missingFiles.length === 0 && fs.existsSync(envPath)) {
    console.log('✅ All checks passed! Your enrollment system is ready.');
    console.log('\nNext steps:');
    console.log('1. Fill in your PayPal & email credentials in .env');
    console.log('2. Run: npm install');
    console.log('3. Run: node server.js');
    console.log('4. Run: python -m http.server 8000');
    console.log('5. Open: http://localhost:8000/courses.html\n');
} else {
    console.log('⚠️  There are some setup issues to fix:');
    if (missingFiles.length > 0) {
        console.log(`   • Missing files: ${missingFiles.join(', ')}`);
    }
    if (!fs.existsSync(envPath)) {
        console.log('   • Missing .env file - copy from .env.example');
    }
    console.log('\nRefer to ENROLLMENT-QUICK-START.md for detailed setup.\n');
}

console.log('='.repeat(70) + '\n');
