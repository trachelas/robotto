'use strict';

let fake = {};

fake.response = function() {
    return {
        statusCode: 200
    };
};

fake.robots = function() {
    return 'User-agent: 007\n' +
        'Disallow: /admin/\n' +
        'Allow: /blog-post/';
};

module.exports = fake;
