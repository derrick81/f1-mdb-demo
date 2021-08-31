# f1-mdb-demo
A simple demo based on nodejs + express showing the flexible schema and transactions capability of MongoDB

# Getting started
## Install dependencies
Run the following command to install the dependencies

    npm install

There are 3 key dependencies:
- MongoDB Driver
- Express JS
- Body parser

# Run the server
Run the following command to start the application

    npm start

You should see the following

    Formula One API service listening at http://:::8081
    Connected to Atlas cluster

# Running the demo
Download postman (https://www.postman.com/downloads/) if you haven't.
Import F1.postman_collection.json
- /init - initializes the collections
- /results - insert + update 2 sets of results separately (Turkey and Singapore)
- /crashes - update Turkey results with a crash object

