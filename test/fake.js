'use strict';

let fake = {};

fake.response = function() {
    return {
        statusCode: 200
    };
};

fake.robots = function() {
    return [
        '#comment 1',
        'User-agent: 007',
        'Disallow: /admin/',
        '#comment 2',
        'Allow: /blog-post/'
    ].join('\n');
};

fake.rules = function() {
    return {
        comments: ['comment 1', 'comment 2'],
        '007': {
            allow: ['/blog-post/'],
            disallow: ['/admin/']
        }
    };
};

module.exports = fake;
