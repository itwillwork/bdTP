module.exports = function(grunt) {

grunt.initConfig({
    shell: {
        options: {
            stdout: true,
            stderr: true,
            interrupt: true,
            atBegin: true,
        },
        server: {
            command: 'node server.js'
        }
    },
    watch: {
        server: {
            files: [
                '*.js'
            ],
            options: {

                livereload: true
            }
        }
    },
    concurrent: {
        target: ['watch', 'shell'],
        options: {
            logConcurrentOutput: true
        }
    },
});

grunt.loadNpmTasks('grunt-contrib-watch');
grunt.loadNpmTasks('grunt-concurrent');
grunt.loadNpmTasks('grunt-shell');

grunt.registerTask('default', ['concurrent']);

};