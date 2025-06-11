# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Run on your local machine

### Server side

Set `.env` file like

```
STRIPE_PUBLISHABLE_KEY="pk_test_"
STRIPE_SECRET_KEY="sk_test_"
```

Start the backend server

```
$ rbenv install $(cat .rbevn)
$ bundle install
$ bundle exec ruby web.rb
```

### Client Side

Set `client/.env` file like

```
REACT_APP_BACKEND_URL=http://localhost:4567
```

Start the client 

```
$ cd client/
$ yarn install
$ yarn start
```
