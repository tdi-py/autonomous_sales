const dotenv = require('dotenv');
dotenv.config();
const postgres = require('postgres');

(async () => {
    try {
        const client = postgres(process.env.DATABASE_URL, { prepare: false });
        const result = await client`SELECT * FROM users LIMIT 1`;
        console.log("SUCCESS:", result);
    } catch (err) {
        console.error("DB ERROR:");
        console.error(err);
    }
    process.exit();
})();
