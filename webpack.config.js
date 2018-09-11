const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const MinifyPlugin = require("babel-minify-webpack-plugin");

const env = process.env.NODE_ENV || 'development';
const isDev = env === 'development';
const isProd = env === 'production';

const extractCss = new ExtractTextPlugin({
    filename: 'index.css',
    disable: isDev
});

const babelMinify = new MinifyPlugin({
});

let pluginsArr = [
    extractCss
];
if (isProd) pluginsArr.push(babelMinify);

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