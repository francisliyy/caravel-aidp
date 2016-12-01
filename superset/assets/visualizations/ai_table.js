const $ = require('jquery');
import d3 from 'd3';
import { fixDataTableBodyHeight } from '../javascripts/modules/utils';
import { timeFormatFactory, formatDate } from '../javascripts/modules/dates';

require('./table.css');
require('datatables.net-bs');
require('datatables-bootstrap3-plugin/media/css/datatables-bootstrap3.css');

function AiTableVis(slice) {
  const fC = d3.format('0,000');
  let timestampFormatter;
  const language_cn = {
        "decimal":        "",
        "emptyTable":     "No data available in table",
        "info":           "Showing _START_ to _END_ of _TOTAL_ entries",
        "infoEmpty":      "Showing 0 to 0 of 0 entries",
        "infoFiltered":   "(filtered from _MAX_ total entries)",
        "infoPostFix":    "",
        "thousands":      ",",
        "lengthMenu":     "Show _MENU_ entries",
        "loadingRecords": "Loading...",
        "processing":     "Processing...",
        "search":         "Search:",
        "zeroRecords":    "No matching records found",
        "paginate": {
            "first":      "首页",
            "last":       "尾页",
            "next":       "下一页",
            "previous":   "上一页"
        },
        "aria": {
            "sortAscending":  ": activate to sort column ascending",
            "sortDescending": ": activate to sort column descending"
        }
    };

  // Injects the passed css string into a style sheet with the specified className
  // If a stylesheet doesn't exist with the passed className, one will be injected into <head>
  function injectCss(className, css) {
    const head = document.head || document.getElementsByTagName('head')[0];
    let style = document.querySelector('.' + className);

    if (!style) {
      if (className.split(' ').length > 1) {
        throw new Error('This method only supports selections with a single class name.');
      }
      style = document.createElement('style');
      style.className = className;
      style.type = 'text/css';
      head.appendChild(style);
    }

    if (style.styleSheet) {
      style.styleSheet.cssText = css;
    } else {
      style.innerHTML = css;
    }
  }

  function refresh() {
    function onError(xhr) {
      slice.error(xhr.responseText, xhr);
      return;
    }
    function onSuccess(json) {
      const data = json.data;
      const fd = json.form_data;
      // Removing metrics (aggregates) that are strings
      const realMetrics = [];
      for (const k in data.records[0]) {
        if (fd.metrics.indexOf(k) > -1 && !isNaN(data.records[0][k])) {
          realMetrics.push(k);
        }
      }
      const metrics = realMetrics;

      function col(c) {
        const arr = [];
        for (let i = 0; i < data.records.length; i++) {
          arr.push(data.records[i][c]);
        }
        return arr;
      }
      const maxes = {};
      for (let i = 0; i < metrics.length; i++) {
        maxes[metrics[i]] = d3.max(col(metrics[i]));
      }

      if (fd.table_timestamp_format === 'smart_date') {
        timestampFormatter = formatDate;
      } else if (fd.table_timestamp_format !== undefined) {
        timestampFormatter = timeFormatFactory(fd.table_timestamp_format);
      }

      const div = d3.select(slice.selector);
      div.html('');

// display Short-hand for the stripe, hover, row-border and order-column classes.
// cell-border Border around all four sides of each cell
// compact Reduce the amount of white-space the default styling for the DataTable uses, increasing the information density on screen (since 1.10.1)
// hover Row highlighting on mouse over
// nowrap  Disable wrapping of content in the table, so all text in the cells is on a single line (since 1.10.1)
// order-column  Highlight the column that the table data is currently ordered on
// row-border  Border around only the top an bottom of each each (i.e. for the rows). Note cell-border and row-border are mutually exclusive and cannot be used together.
// stripe  Row striping

      let classes = 'dataframe dataframe table dataTable no-footer'
      if (fd.default_style.length > 0){
        fd.default_style.forEach((d) => {
          classes += " " + d;
        })
      }
      console.log('classes :' + classes);
      const table = div.append('table')
        .classed(classes, true)
        .attr('width', '100%');

      table.append('thead').append('tr')
        .selectAll('th')
        .data(data.columns)
        .enter()
        .append('th')
        .text(function (d) {
          return d;
        });

      table.append('tbody')
        .selectAll('tr')
        .data(data.records)
        .enter()
        .append('tr')
        .selectAll('td')
        .data((row) => data.columns.map((c) => {
          let val = row[c];
          if (c === 'timestamp') {
            val = timestampFormatter(val);
          }
          return {
            col: c,
            val,
            isMetric: metrics.indexOf(c) >= 0,
          };
        }))
        .enter()
        .append('td')
        .classed('dt-center', true)
        .style('background-image', function (d) {
          if (d.isMetric) {
            const perc = Math.round((d.val / maxes[d.col]) * 100);
            return (
              `linear-gradient(to right, lightgrey, lightgrey ${perc}%, ` +
              `rgba(0,0,0,0) ${perc}%`
            );
          }
          return null;
        })
        .attr('title', (d) => {
          if (!isNaN(d.val)) {
            return fC(d.val);
          }
          return null;
        })
        .attr('data-sort', function (d) {
          return (d.isMetric) ? d.val : null;
        })
        .on('click', function (d) {
          if (!d.isMetric) {
            const td = d3.select(this);
            if (td.classed('filtered')) {
              slice.removeFilter(d.col, [d.val]);
              d3.select(this).classed('filtered', false);
            } else {
              d3.select(this).classed('filtered', true);
              slice.addFilter(d.col, [d.val]);
            }
          }
        })
        .style('cursor', function (d) {
          return (!d.isMetric) ? 'pointer' : '';
        })
        .html((d) => {
          if (d.isMetric) {
            return slice.d3format(d.col, d.val);
          }
          return d.val;
        });
      const height = slice.container.height();


      let options = {
        paging: false,
        aaSorting: [],
        searching: fd.include_search,
        bInfo: false,
        scrollY: height + 'px',
        scrollCollapse: true,
        scrollX: false,
        language: language_cn,
        dom: '<"top"i>rt<"row"<"col-md-4"f><"col-md-4"l><"col-md-4"p>><"clear">'
      }
      if (fd.include_paging){
        options['paging'] = fd.include_paging
        if (fd.pageLength != '' || fd.pageLength != null){
          options['pageLength'] = fd.pageLength
        }
        if (fd.pagingType != '' || fd.pagingType != null){
          options['pagingType'] = fd.pagingType
        }
      }

      const datatable = slice.container.find('.dataTable').DataTable(options);
      fixDataTableBodyHeight(
          slice.container.find('.dataTables_wrapper'), height);
      // Sorting table by main column
      if (fd.metrics.length > 0) {
        const mainMetric = fd.metrics[0];
        datatable.column(data.columns.indexOf(mainMetric)).order('desc').draw();
      }
      slice.done(json);
      slice.container.parents('.widget').find('.tooltip').remove();
    }
    $.getJSON(slice.jsonEndpoint(), onSuccess).fail(onError);
  }

  return {
    render: refresh,
    resize() {},
  };
}

module.exports = AiTableVis;
