const http = require('http');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const myTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
};

const uri = "mongodb+srv://shivaprasadyadav8688:Shiva%408688@cluster0.vbibnbz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

async function connectToMongoDB() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
    } catch (err) {
        console.error("Error connecting to MongoDB:", err);
    }
}

async function getMoviesFromDB() {
    try {
        const cursor = client.db("moviesdb").collection("moviescollection").find({});
        const results = await cursor.toArray();
        return results;
    } catch (err) {
        console.error("Error fetching movies from MongoDB:", err);
        return [];
    }
}

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');

    if (req.url === '/') {
        fs.readFile(path.join(__dirname, 'public', 'index.html'), 'utf-8', (err, data) => {
            if (err) {
                console.error(err);
                serveErrorPage(res);
                return;
            }
            res.writeHead(200, {
                'Content-Type': 'text/html',
            });
            res.end(data);
        });
    }
    else if (req.url === '/api') {
        try {
            // Get movies from MongoDB instead of local file
            const movies = await getMoviesFromDB();
            res.writeHead(200, {
                'Content-Type': 'application/json',
            });
            res.end(JSON.stringify(movies));
        } catch (err) {
            console.error("Error serving /api:", err);
            serveErrorPage(res);
        }
    }
    else {
        const filePath = path.join(__dirname, 'public', req.url);
        const extname = path.extname(filePath);
        const contentType = myTypes[extname];

        fs.readFile(filePath, (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    serveErrorPage(res);
                } else {
                    res.writeHead(500);
                    res.end(`Server Error: ${err.code}`);
                }
                return;
            }
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    }
});

function serveErrorPage(res) {
    fs.readFile(path.join(__dirname, 'public', '404.html'), 'utf-8', (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(data);
    });
}

connectToMongoDB()
    .then(() => {
        server.listen(4139, () => console.log("Server is running on port 4139"));
    })
    .catch(err => {
        console.error("Failed to connect to MongoDB:", err);
        process.exit(1);
    });