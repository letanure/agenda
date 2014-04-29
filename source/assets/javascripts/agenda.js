var agenda = (function() {
  'use strict';

  var config = {
    api: {
      salon: 'api/salon.json',
      day: 'api/dia.json'
    }
  };

  var salonData = {};

  var messages= {
    config: {
      danger: "Erro ao carregar os dados do salão."
    },
    day: {
      danger: "Erro ao carregar os agendamentos do dia."
    }
  }

  function init() {
    console.log('agenda init');
    loadConfig();
  }

  function message (section, type) {
    var html = [
    '<div class="alert alert-' + type + ' alert-dismissable">',
    '<a class="close" data-dismiss="alert" href="#">&times;</a>',
      messages[section][type],
    '</div>'
    ].join('')
    $('#messages').append(html);
  }

  // Carrega as conficuraçoes do salao para montar a tabela
  function loadConfig() {
    $.getJSON( config.api.salon, function( data ) {
      salonData = data;
      insertTable(data);
    }).fail(function() {
      message('config', 'danger');
    });
  }

  function insertTable (data) {
    $('#loading').fadeOut();
    var html = [
      '<table class="table" style="margin-bottom:0;"">',
        '<thead>',
          '<tr>',
            '<th></th>',
            (function () {
              var htmlHours = '';
              $.each(data.hours, function (hour, enabled) {
                htmlHours += '<th>' + hour + '</th>';
              });
              return htmlHours;
            })(),
        '</thead>',
        '<tbody>',
          (function () {
            var linesTable = '';
            $.each(data.professionals, function (id, professional) {
              linesTable += '<tr id="professional-' + id + '">';
              linesTable += '<th>' + professional.name + '</th>';
              $.each(data.hours, function (hour, enabled) {
                linesTable += '<td data-professional="' + id + '" data-hour="' + hour + '"></td>';
              });
              linesTable += '</tr>';
            });
            return linesTable;
          })(),
        '</tbody>',
      '</table>'
    ].join('');
    $('#agenda-area').html(html);
    $('#boxTable').fadeIn();
    horario()
    day();
  }

  function day () {
    $.getJSON( config.api.day, function( data ) {
      insertAppointments(data)
    }).fail(function() {
      message('day', 'danger');
    });
  }

  function insertAppointments (appointments) {
    $.each(appointments, function(index, appointment) {
      $('tr#professional-' + appointment.professional + ' td[data-hour="' + appointment.hour + '"]')
        .append(
          '<span class="appointment-name" data-name="' + appointment.client.name + '">' + appointment.client.name.split(' ')[0]  + '</span>' +
          '<span class="appointment-specialtie" data-specialtie="' + appointment.specialtie + '">' + salonData.specialties[appointment.specialtie].small + '</span>' +
          '<span class="appointment-phone" data-phone="' + appointment.client.phone + '">' + appointment.client.phone  + '</span>'
        )
        .css('background', salonData.specialties[appointment.specialtie].color )
    });
  }

  function horario () {
    $('td').one('click', function () {
      var client = {};
      var name = $(this).find('.appointment-name').data('name');
      var phone = $(this).find('.appointment-phone').data('phone');
      var specialtie = $(this).find('.appointment-specialtie').data('specialtie');
      client.name = name || '';
      client.phone = phone || '';
      client.specialtie = specialtie || '';
      var id = $(this).data('professional');
      var htmlPopover = '<div class="col-md-12">'+
            '<form class="form-horizontal" role="form">'+
              '<div class="form-group">'+
                '<label for="inputEmail3" class="col-sm-4 control-label">Serviço</label>'+
                '<div class="col-sm-8">'+
                  '<select class="form-control">'+
                    '<option>Selecione</option>'+
                    (function (argument) {
                      var htmlSpecialties = '';
                      $.each(salonData.professionals[id].specialties, function (i, idSpecialties ) {
                          htmlSpecialties += '<option value="' + idSpecialties +  '" ' + (client.specialtie == idSpecialties ? 'selected' : '') + '>'  + salonData.specialties[idSpecialties].name + '</option>'
                      });
                      return htmlSpecialties;
                    })() +
                  '</select>'+
                '</div>'+
              '</div>'+
              '<div class="form-group">'+
                '<label for="inputEmail3" class="col-sm-4 control-label">Nome</label>'+
                '<div class="col-sm-8">'+
                  '<input type="nome" class="form-control" placeholder="Nome" value="' + client.name + '">'+
                '</div>'+
              '</div>'+
              '<div class="form-group">'+
                '<label for="inputEmail3" class="col-sm-4 control-label">Telefone</label>'+
                '<div class="col-sm-8">'+
                  '<input type="text" class="form-control" placeholder="Telefone"  value="' + client.phone + '">'+
                '</div>'+
              '</div>'+
              '<div class="form-group">'+
                '<button class="btn btn-primary" style="margin-bottom:5px" type="button">Agendar</button>' +
                '<button class="btn btn-inverse" style="margin-bottom:5px" type="button">Bloquear horário</button>' +
              '</div>'+
            '</form>'+
          '</div>';
      $(this).popover({
          title: salonData.professionals[id].name,
          html: true,
          placement: 'top',
          content: htmlPopover
      })
      $(this).tooltip('show');
    })
  }



  return {
    init:init
  };

}());

$(document).ready(function() {
  agenda.init();
});
