const $ = require('jquery');

require('./markup.css');

function AiMarkupWidget(slice) {
  function refresh() {
    $('#code').attr('rows', '15');
    $.getJSON(slice.jsonEndpoint(), function (payload) {
      slice.container.html(payload.data.html);
      slice.done(payload);
    })
      .fail(function (xhr) {
        slice.error(xhr.responseText, xhr);
      });
  }
  return {
    render: refresh,
    resize: refresh,
  };
}

module.exports = AiMarkupWidget;
