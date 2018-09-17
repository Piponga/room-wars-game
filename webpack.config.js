const webpack = require("webpack");
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const MinifyPlugin = require("babel-minify-webpack-plugin");

const env = process.env.NODE_ENV || 'development';
const DEVELOPMENT = env === 'development';
const PRODUCTION = env === 'production';


const extractCss = new ExtractTextPlugin({
    filename: 'index.css',
    disable: DEVELOPMENT
});

const babelMinify = new MinifyPlugin({
});

let pluginsArr = [
    extractCss,
    // if process.env.NODE_ENV = 'development' in any .js file:
    // console.log(PRODUCTION); // prints false
    // console.log(DEVELOPMENT); // prints true
    new webpack.DefinePlugin({
        PRODUCTION: PRODUCTION,
        DEVELOPMENT: DEVELOPMENT
    })
];
// if (PRODUCTION) pluginsArr.push(babelMinify);

module.exports = {
    entry: {
        bundle: './src/js/index.js'
    },
    output: {
        path: path.resolve(__dirname, 'public'),
        filename: 'bundle.js'
    },
    plugins: pluginsArr,
    externals: {
        oimo: 'OIMO', //or true
        cannon: 'CANNON', //or true
        earcut: 'EARCUT'
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /node_modules/,
            use: 'babel-loader'
        }, {
            test: /\.css$/,
            exclude: /node_modules/,
            use: extractCss.extract({
                use: [
                    {loader: 'css-loader'}
                ],
                fallback: 'style-loader'
            })
        }]
    }
};