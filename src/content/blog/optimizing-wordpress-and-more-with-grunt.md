---
title: "Optimizing WordPress (and more) with Grunt"
description: "How I used Grunt to concatenate, minify and gzip the styles and scripts of a WordPress theme, with a Gruntfile.coffee you can borrow and a fingerprint trick for cache busting."
date: "2013-02-28"
tags: ["wordpress", "javascript", "performance", "webdev"]
---

From the very moment I installed WordPress and a theme for it, it bugged me as a developer that neither WordPress itself nor the theme did anything to optimize the number of stylesheets and scripts being loaded: no minification, no concatenation, just a pile of requests to the server for 5 stylesheets and 12 scripts. All of that made me sad, but somehow I never got around to it.

But yesterday I stumbled upon a great article on Habr about [Grunt](http://habrahabr.ru/post/170937/), which ended with a link to an even more [useful article](http://nano.sapegin.ru/all/grunt-0-4/) by Artem Sapegin about Grunt as a build system for front-end developers. After reading both articles I thought this was simply the perfect solution to my WordPress problem and dove into learning Grunt.

Here is what came out of it... My `Gruntfile.coffee`:

```coffeescript
'use strict'

module.exports = (grunt)->
  grunt.initConfig
    concat:
      js:
        src: [
          'wp-includes/js/jquery/jquery.js',
          'wp-content/themes/memoir/includes/js/jquery.easing.1.3.js',
          'wp-content/themes/memoir/includes/fancybox/jquery.mousewheel-3.0.4.pack.js',
          'wp-content/themes/memoir/includes/fancybox/jquery.fancybox-1.3.4.pack.js',
          'wp-content/themes/memoir/includes/js/jquery.mobilemenu.js',
          'wp-content/themes/memoir/includes/js/jquery.flexslider-min.js',
          'wp-content/themes/memoir/includes/js/jquery.fitvids.js',
          'wp-content/themes/memoir/includes/js/social-likes.min.js',
          'wp-content/themes/memoir/includes/js/highlight.pack.js',
          'wp-content/themes/memoir/includes/js/highlight.my.js',
          'wp-content/themes/memoir/includes/js/memoir.js',
          'wp-includes/js/comment-reply.js'
        ]
        dest: 'wp-content/themes/memoir/combined.js'

    uglify:
      js:
        src: '<%= concat.js.dest %>'
        dest: 'wp-content/themes/memoir/combined.min.js'

    cssmin:
      css:
        src: [
          'wp-content/themes/memoir/style.css',
          'wp-content/themes/memoir/includes/fancybox/jquery.fancybox-1.3.4.css',
          'wp-content/themes/memoir/includes/js/flexslider.css',
          'wp-content/themes/memoir/includes/js/social-likes.css',
          'wp-content/themes/memoir/includes/js/highlight.css'
        ]
        dest: 'wp-content/themes/memoir/combined.css'

    shell:
      gzipJS:
        command: 'gzip --best -f -c "<%= uglify.js.dest %>" > "<%= uglify.js.dest %>.gz"'
      gzipCSS:
        command: 'gzip --best -f -c "<%= cssmin.css.dest %>" > "<%= cssmin.css.dest %>.gz"'

    copy:
      templates:
        options:
          processContent: grunt.template.process
        files:
          'wp-content/themes/memoir/header.php': 'wp-content/themes/memoir/header.tpl.php'
          'wp-content/themes/memoir/footer.php': 'wp-content/themes/memoir/footer.tpl.php'

  grunt.loadNpmTasks 'grunt-contrib-concat'
  grunt.loadNpmTasks 'grunt-contrib-cssmin'
  grunt.loadNpmTasks 'grunt-contrib-uglify'
  grunt.loadNpmTasks 'grunt-contrib-copy'
  grunt.loadNpmTasks 'grunt-shell'

  grunt.registerTask 'default', ['concat', 'uglify', 'cssmin', 'shell', 'copy']
  grunt.registerTask 'js', ['concat:js', 'uglify', 'shell:gzipJS', 'copy']
  grunt.registerTask 'css', ['cssmin', 'shell:gzipCSS', 'copy']
```

I write JS only in CoffeeScript, because after trying it once I developed a permanent aversion to the verbosity of JS syntax. Everything in the file is pretty self-explanatory; you can read more about the syntax in the articles mentioned above, which also cover installing Grunt and its plugins. The [official Grunt site](http://gruntjs.com) helps a lot too :)

There are two interesting bits here:

1. ```coffeescript
     shell:
         gzipJS:
           command: 'gzip --best -f -c "<%= uglify.js.dest %>" > "<%= uglify.js.dest %>.gz"'
         gzipCSS:
           command: 'gzip --best -f -c "<%= cssmin.compress.dest %>" > "<%= cssmin.compress.dest %>.gz"'
   ```

   I couldn't find a plugin for gzipping files (maybe I didn't look hard enough). There is [grunt-contrib-compress](https://npmjs.org/package/grunt-contrib-compress), but it doesn't let you change the compression level. So I solved it like this, with a plain gzip call in the shell. The [grunt-shell](https://github.com/sindresorhus/grunt-shell) plugin takes care of that, and it really opens up endless room for creativity :)

   This step is optional in general; it's just that I have the `gzip_static` directive enabled in nginx, so that when ready-made `*.gz` files exist, nginx serves them directly instead of compressing on its own.

2. ```coffeescript
     copy:
         templates:
           options:
             processContent: grunt.template.process
           files:
             'wp-content/themes/memoir/header.php': 'wp-content/themes/memoir/header.tpl.php'
             'wp-content/themes/memoir/footer.php': 'wp-content/themes/memoir/footer.tpl.php'
   ```

   Here we copy the theme's header and footer templates, running them through Grunt's Lo-Dash templating engine along the way, so that we can do things like this:

   ```html
   <link rel="stylesheet" type="text/css" href="<?php bloginfo('stylesheet_directory'); ?>/combined.css?<%= grunt.template.today('yyddmmHHMMss') %>" media="screen" />
   <script type="text/javascript" src="<?php bloginfo('stylesheet_directory'); ?>/combined.min.js?<%= grunt.template.today('yyddmmHHMMss') %>"></script>
   ```

   This solves the problem of refreshing cached styles and scripts on the client.

Naturally, we rip the default stylesheet and script includes out of the theme (not forgetting to check `functions.php`, and all the other `*.php` files while we're at it, for file includes; the keywords to search for are `wp_enqueue_style` and `wp_enqueue_script`) and replace them with the example above.

Now, whenever the theme's styles and/or scripts change, all I have to do is run:

```bash
$ grunt
```

Or just for the scripts:

```bash
$ grunt js
```

Or just for the styles:

```bash
$ grunt css
```

Then upload the `combined.*` files plus the `header.php` and `footer.php` templates, and that's it. The visitor now gets one stylesheet and one script file, which, in the best traditions of web development, sits at the very bottom of the template. After all these manipulations [YSlow](http://yslow.org) gave a score of **85** points.

And of course you can and should optimize not just WordPress this way, but any other site that has no built-in mechanisms for minifying and concatenating stylesheets and scripts.

My `package.json`, in case anyone is interested:

```json
{
  "name": "svyatov.ru",
  "version": "1.0.0",
  "devDependencies": {
    "grunt": "~0.4.0",
    "grunt-contrib-concat": "~0.1.3",
    "grunt-contrib-cssmin": "~0.4.1",
    "grunt-contrib-uglify": "~0.1.1",
    "grunt-shell": "~0.2.1",
    "grunt-contrib-copy": "~0.4.0"
  }
}
```

## Update, March 6, 2013

Thanks to Artem's comment for steering my thinking in a better direction and arming me with a great plugin along the way. Using Artem's plugin, I simplified the setup to the following...

I replaced the `grunt-contrib-copy` plugin with [grunt-fingerprint](https://github.com/sapegin/grunt-fingerprint):

```coffeescript
fingerprint:
  assets:
    src: 'wp-content/themes/memoir/combined.*'
    filename: 'wp-content/themes/memoir/assets-fingerprint.php',
    template: "<?php define('ASSETS_FINGERPRINT', '<%= fingerprint %>');"
```

In `header.php` the styles are now included like this:

```html
<?php require_once(get_template_directory().'/assets-fingerprint.php'); ?>
<link rel="stylesheet" type="text/css" href="<?php bloginfo('stylesheet_directory'); ?>/combined.css?<?php echo ASSETS_FINGERPRINT; ?>" media="screen" />
```

The scripts in `footer.php` are included the same way:

```html
<?php require_once(get_template_directory().'/assets-fingerprint.php'); ?>
<script type="text/javascript" src="<?php bloginfo('stylesheet_directory'); ?>/combined.min.js?<?php echo ASSETS_FINGERPRINT; ?>"></script>
```

After an update I now only have to upload the `combined.*` files and `assets-fingerprint.php`, which is simpler and more convenient, and on top of that there's no need to keep extra templates around.
