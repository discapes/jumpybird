module.exports = api =>  ({
  presets: api.env() === 'production' ? ["minify"] : [],
});