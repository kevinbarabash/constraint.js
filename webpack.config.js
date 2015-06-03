module.exports = {
    entry: './src/descriptor.js',
    output: {
        path: __dirname + '/build',
        filename: 'bundle.js'
    },
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                exclude: /(node_modules|bower_components)/,
                loader: 'babel?stage=0'
            },
            {
                test: /\.json$/,
                loader: 'json-loader'
            }
        ]
    }
};
