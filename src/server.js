import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';
const app = express();
const port = 8000;

app.use(express.static(path.join(__dirname, '/build')));
app.use(bodyParser.json());

const withDB = async (operations, res) => {
  try {
    // Create the database connection to the localhost.
    const client = await MongoClient.connect('mongodb://localhost/27017', { useNewUrlParser: true});
    // Create database object.
    const db = client.db('tech-blog');
    // Wait for the promise.
    await operations(db);
    // Disconnect the databse.
    client.close();
  } catch (error) {
    console.log(error);
    // Sent back the error message as a JSON.
    res.status(500).json({ message: 'Something went wrong', error: error });
    console.log("Something went wrong!");
  };
};

// Response to GET request for an article webpage.
app.get('/api/articles/:name', async (req, res) => {
    withDB(async (db) => {
      // Get the article name from the request.
      const articleName = req.params.name;
      console.log(articleName);
      // Query the mongodb database with the article name.
      const articleInfo = await db.collection('articles').findOne({ name: articleName });
      console.log(articleInfo);
      // Sent back a successful response.
      res.status(200).json(articleInfo);
    }, res);
})

// Response to GET request for ALL article webpages.
app.get('/api/articles/', async (req, res) => {
    withDB(async (db) => {
    const articleInfo = await db.collection('articles').find({}).toArray(function(e, result){
      console.log(result);
      res.send(result);
    });
    console.log(articleInfo);
    res.status(200).json(articleInfo);
      // Sent back a successful response.
      res.status(200).json(result);
    }, res);
})


// Response to POST request to upvote an article.
app.post('/api/articles/:name/upvote', async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;
    const articleInfo = await db.collection('articles').findOne({ name: articleName });
    await db.collection('articles').updateOne({ name: articleName }, {
      '$set': {
        upvotes: articleInfo.upvotes + 1,
      },
    });
    const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName});
    res.status(200).json(updatedArticleInfo);
  }, res);
})

// Response to POST request to add a comment.
app.post('/api/articles/:name/add-comment', (req, res) => {

  const { username, text} = req.body;
  const articleName = req.params.name;

  withDB(async (db) => {
    const articleInfo = await db.collection('articles').findOne({ name: articleName});
    await db.collection('articles').updateOne({ name: articleName}, {
      '$set': {
        comments: articleInfo.comments.concat({ username, text}),
      },
    });
    const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName});
    res.status(200).json(updatedArticleInfo);
  }, res);
});

app.get('*', (req, res) => {
		res.sendFile(path.join(__dirname + '/build/index.html'));
	});

// Create listener.
app.listen(port, () => {
  console.log(`Express listening on port ${port}`);
  })
