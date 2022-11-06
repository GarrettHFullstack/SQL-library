const { client } = require("./index")

async function testDB() {
    try{
        // const result = await client.query('SELECT * FROM users;')
        const users = await getAllusers()
        // console.log(result)
        // console.log(users[0].id)
        const updateUserResult =  await updateUser(users[0].id , {
            name: "Newname Sogood",
            location: "cheese"
          });
        const posts = await getAllPosts()
          await updatePosts(posts[1].id , {content: "chipper is a flipper", title: "remunder"})
        // console.log(updateUserResult)
        // const posts = await getAllPosts()
        // console.log(posts)
        const indiv = await getPostByUser(1)
        // console.log(indiv)
        await getUserById(3)
        const updatePostTagsResult = await updatePost(posts[1].id, {
          tags: ["#youcandoanything", "#redfish", "#bluefish"]
        });
        console.log("Result:", updatePostTagsResult);
    }catch(error){
        console.log(error)
    }
}

async function getAllusers(){
    const { rows } = await client.query(`
        SELECT id, username, name, location, active
        FROM users;
    `)
    return rows
}
async function dropTables(){
    try {
        await client.query(
            `
            DROP TABLE IF EXISTS posts_tags;
            DROP TABLE IF EXISTS tags;
            DROP TABLE IF EXISTS posts;
            DROP TABLE IF EXISTS users;
            ` 
        )
    } catch (error) {
        console.log(error)
    }
}

async function createTables(){
    try {
        await client.query(`
        CREATE TABLE users(
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            location VARCHAR(255) NOT NULL,
            active BOOLEAN DEFAULT true
         );
         CREATE TABLE posts(
            id SERIAL PRIMARY KEY,
            "authorID" INTEGER REFERENCES users(id) NOT NULL,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            active BOOLEAN DEFAULT true
            );
        CREATE TABLE tags(
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL 
        );
        CREATE TABLE posts_tags(
            "postId" INTEGER REFERENCES posts(id),
            "tagId" INTEGER REFERENCES tags(id),
            UNIQUE ("postId","tagId")
        );
        `)
    } catch (error) {
        console.log()
    }
}
async function createUsers({ username, password, name, location }){
    try {
        await client.query(`
            INSERT INTO users(username, password, name, location)
            VALUES ($1,$2,$3,$4);
        `,[ username, password, name, location])
    } catch (error) {
        console.log(error)
    }
}

async function updateUser(id, fields = {}){

    const setString = Object.keys(fields).map((key, index) => 
        {return `"${key}" =$${ index + 1}`}
    ).join(', ')

    if (setString.length === 0){
        return;
    }

    try {
        const {rows : [user] }= await client.query(`
        UPDATE users
        SET ${ setString }
        WHERE id = ${ id }
        RETURNING *;
        `, Object.values(fields))
        return user
    } catch (error) {
        console.log(error)
    }
}

async function createPost({authorID,title, content,tags =[]}){
    try{
        const { rows: [post]} = await client.query(`
            INSERT INTO posts("authorID", title, content)
            VALUES ($1,$2,$3)
            RETURNING *;
        `,[authorID,title,content])
        const tagList = await createTags(tags)

        return addTagsToPost(post.id, tagList)
    }catch(error){
        console.log(error)
    }

}
async function getAllPosts(){
    try {
        const {rows} = await client.query(`
        SELECT * FROM posts;
        `)
        return rows
    } catch (error) {
        console.log(error)
    }
}
async function getPostByUser(userId){
    try {
        const { rows } = await client.query(`
            SELECT * FROM posts
            WHERE "authorID" = ${userId};
        `)
        return rows
    } catch (error) {
        console.log(error)
    }
}
async function updatePosts(id, fields = {}){

    const setString = Object.keys(fields).map((key, index) => 
        {return `"${key}" =$${ index + 1}`}
    ).join(', ')

    if (setString.length === 0){
        return;
    }

    try {
        const {rows : [post] }= await client.query(`
        UPDATE posts
        SET ${ setString }
        WHERE id = ${ id }
        RETURNING *;
        `, Object.values(fields))
        return post
    } catch (error) {
        console.log(error)
    }
}

////////////////////////////////////////////////////////////////
async function getUserById (userId){
    try{
        const { rows : [user] } = await client.query(`
        SELECT id, username, name, location, active FROM users
        WHERE id = ${userId};
        `)
        if(!user){
            return null
        }
        user.post = await getPostByUser(userId)
//////////////////////////////////////////////////////////////
        return user
    }catch(error){
        console.log(error)
    }
}
async function createIntitalPosts(){
    try{
    await createPost({authorID: 1, title: "HOWDY", content: "HOWDY DO ON THE FIRST POST",tags: ["#happy", "#youcandoanything"]})
    await createPost({authorID: 3, title: "Hward", content: "HOWDY DO ON THE FIRST POST",tags: ["#happy", "#youcandoanything"]})
    await createPost({authorID: 1, title: "RAGNAROCK", content: "HOWDY DO ON THE FIRST POST",tags: ["#happy", "#youcandoanything"]})
    } catch (error){
        console.log(error)
    }
}
async function createInitialUsers(){
    try{
    await createUsers({ username: "jimbo", password: "SHLAMA", name: "Jimbo", location: "cowlifornia"})
    await createUsers({ username: "sfsdgsdg", password: "SHL", name: "sfs", location: "Randomia"})
    await createUsers({ username: "jimbMegoao", password: "SH",name: "MegoJim", location: "Los Angeles"})
    } catch (error){
         console.log(error)
    }

}
async function createTags(tagList){
    if (tagList.length === 0){
        return ;
    }

    
    const insertValues = tagList.map((_, index)=> {return `$${index + 1}`}).join(`),(`)
    
    const selectValues = tagList.map((_, index)=> {return `$${index + 1}`}).join(`, `)
    
    try{
        await client.query(`
        INSERT INTO tags(name)
        VALUES (${insertValues})
        ON CONFLICT (name) DO NOTHING;
        `,tagList)

        const { rows } = await client.query(`
        SELECT * FROM tags
        WHERE name IN (${selectValues});
        `,tagList)
        return(rows)
    }catch(error){
        console.log(error)
    }
}
async function createPostTag(postId, tagId){
    try {
        await client.query(
            `
            INSERT INTO posts_tags("postId", "tagId")
            VALUES ($1,$2)
            ON CONFLICT ("postId","tagId") DO NOTHING;
            `, [postId,tagId]
        )
    } catch (error) {
        console.log(error)
    }
}
async function addTagsToPost(postId, tagList){
    try{
        const createPostTagPromises = tagList.map(tag => 
            {return createPostTag(postId,tag.id)}
        )
        await Promise.all(createPostTagPromises)
        return await getPostById(postId)
    }catch(error){

    }
}
async function getPostById(postId) {
    try {
      const { rows: [ post ]  } = await client.query(`
        SELECT *
        FROM posts
        WHERE id=$1;
      `, [postId]);

      const { rows: tags } = await client.query(`
        SELECT tags.*
        FROM tags
        JOIN posts_tags ON tags.id=posts_tags."tagId"
        WHERE posts_tags."postId"=$1;
      `, [postId])
      const { rows: [author] } = await client.query(`
        SELECT id, username, name, location
        FROM users
        WHERE id=$1;
      `, [post.authorID])


      
  
      post.tags = tags;
      post.author = author;
      delete post.authorId;
  
      return post;
    } catch (error) {
      throw error;
    }
  }
  async function createInitialTags() {
    try {
        
      const [happy, sad, inspo, catman] = await createTags([
        '#happy', 
        '#worst-day-ever', 
        '#youcandoanything',
        '#catmandoeverything'
      ]);
      const [postOne, postTwo, postThree] = await getAllPosts();
  
      await addTagsToPost(postOne.id, [happy, inspo]);
      await addTagsToPost(postTwo.id, [sad, inspo]);
      await addTagsToPost(postThree.id, [happy, catman, inspo]);

    } catch (error) {
      console.log("Error creating tags!");
      throw error;
    }
  }
  async function updatePost(postId, fields = {}) {
    // read off the tags & remove that field 
    const { tags } = fields; // might be undefined
    delete fields.tags;
  
    // build the set string
    const setString = Object.keys(fields).map(
      (key, index) => `"${ key }"=$${ index + 1 }`
    ).join(', ');
  
    try {
      // update any fields that need to be updated
      if (setString.length > 0) {
        await client.query(`
          UPDATE posts
          SET ${ setString }
          WHERE id=${ postId }
          RETURNING *;
        `, Object.values(fields));
      }
  
      // return early if there's no tags to update
      if (tags === undefined) {
        return await getPostById(postId);
      }
  
      // make any new tags that need to be made
      const tagList = await createTags(tags);
      const tagListIdString = tagList.map(
        tag => `${ tag.id }`
      ).join(', ');
  
      // delete any post_tags from the database which aren't in that tagList
      await client.query(`
        DELETE FROM posts_tags
        WHERE "tagId"
        NOT IN (${ tagListIdString })
        AND "postId"=$1;
      `, [postId]);
  
      // and create post_tags as necessary
      await addTagsToPost(postId, tagList);
  
      return await getPostById(postId);
    } catch (error) {
      throw error;
    }
  }

async function rebuidDB(){
    try {
        client.connect()
        await dropTables();
        await createTables();
        await createInitialUsers()
        await createIntitalPosts()
        await createInitialTags();
        await testDB()
        client.end() 
    } catch (error) {
        console.log(error)
    }

}

rebuidDB()


