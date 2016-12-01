// JS
window.jQuery = window.$ = require('jquery');
require('jquery-ui');
require('bootstrap-datepicker');
require('../node_modules/bootstrap-datepicker/js/locales/bootstrap-datepicker.zh-CN.js');
require('../node_modules/bootstrap-datepicker/dist/css/bootstrap-datepicker3.css');
require('../node_modules/bootstrap-datepicker/dist/css/bootstrap-datepicker3.standalone.css');

import React from 'react';
import ReactDOM from 'react-dom';

const propTypes = {
  origSelectedValues: React.PropTypes.object,
  filtersChoices: React.PropTypes.object,
  onChange: React.PropTypes.func,
  style: React.PropTypes.string,
  granularity: React.PropTypes.string,
};

const defaultProps = {
  origSelectedValues: {},
  onChange: () => {},
  style: 'input',
};

class CalendarFilter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedValues: props.origSelectedValues,
    };
  }

  componentDidUpdate() {
    this.componentDidMount();
  }

  componentDidMount() {
    const _this = this;
    console.log('execute componentDidMount...');
    let options = {
      language: 'zh-CN',
      todayHighlight: true,
      // changeDate: handleChangeDate,
      format: 'yyyy-mm-dd',
      todayBtn: true,
      autoclose: true,
    };

    const granularity = this.props.granularity;
    switch (granularity) {
      case "year": 
        options['format'] = 'yyyy';
        break;
      case "month": 
        options['format'] = 'yyyy-mm';
        break;
      case "week":
        options['format'] = 'yyyy-mm-dd'
        break;
      case "day": 
        options['format'] = 'yyyy-mm-dd';
        break;
      default:  
        options['format'] = 'yyyy-mm-dd';
    }
    options['maxViewMode'] = granularity + 's';
    options['minViewMode'] = granularity + 's';
    
    console.log('this.props.style : ' + this.props.style);
    if (_this.props.style == 'date-range'){
      $('.input-daterange input').each(function() {
        let filter = this.name;
        $(this).datepicker(options).on('changeDate', function(e) {
          console.log('e.target.value: ' + e.target.value);
          console.log('e.date: ' + e.date);
          console.log('e.format: ' + e.format('yyyy-mm-dd'));
          const clickedValue = e.format('yyyy-mm-dd');
          const selectedValues = Object.assign({}, _this.state.selectedValues);
          selectedValues[filter] = clickedValue;
          _this.setState({ selectedValues });
          _this.props.onChange(filter, clickedValue);
        });
      })
    } else {
      $('#datepicker').datepicker(options).on('changeDate', function(e){
        // console.log('e.date...' + e.date);
        // $(".inline input[name='__from']").val(e.date);
        // $(".inline input[name='__to']").val(e.date);
        console.log('e.target.value: ' + e.target.value);
        console.log('e.date: ' + e.date);
        console.log('e.format: ' + e.format('yyyy-mm-dd'));
        const clickedValue = e.format('yyyy-mm-dd');
        const selectedValues = Object.assign({}, _this.state.selectedValues);
        selectedValues['__from'] = clickedValue;
        selectedValues['__to'] = clickedValue;
        _this.setState({ selectedValues });
        _this.props.onChange('__from', clickedValue);
      });
    }
  }

  render() {
    let html = "";
    if (this.props.style == 'date-range'){
      html = (<div className="input-group input-daterange">
              <input value={this.state.selectedValues['__from']} name = "__from" type="text" className="form-control"/>
              <span className="input-group-addon">to</span>
              <input value={this.state.selectedValues['__to']} name = "__to" type="text" className="form-control"/>
          </div>);
    } else {
      html = (<div className="inline">
      <div id="datepicker"></div>
      <input value={this.state.selectedValues['__from']} type="hidden" name="__from"/>
      <input value={this.state.selectedValues['__to']} type="hidden" name="__to"/>
      </div>);
    }

    return (
      <div>
      {html}
      </div>
    );
  }
}

CalendarFilter.propTypes = propTypes;
CalendarFilter.defaultProps = defaultProps;

function filterBox(slice) {
  const refresh = function () {
    const url = slice.jsonEndpoint({ extraFilters: false });
    $.getJSON(url, (payload) => {
      const fd = payload.form_data;
      const filtersChoices = {};
      ReactDOM.render(
        <CalendarFilter
          filtersChoices={filtersChoices}
          onChange={slice.setFilter}
          style={fd.calendar_style}
          origSelectedValues={slice.getFilters() || {}}
          granularity={fd.domain_granularity}
        />,
        document.getElementById(slice.containerId)
      );
      slice.done(payload);
    })
    .fail(function (xhr) {
      slice.error(xhr.responseText, xhr);
    });
  };
  return {
    render: refresh,
    resize: () => {},
  };
}

module.exports = filterBox;
