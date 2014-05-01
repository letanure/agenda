var agenda = (function() {
  'use strict';

  var config = {
    api: {
      salon: 'api/salon.json',
      day: 'api/dia.json',
      save: 'api/save.json',
      block: 'api/block.json',
      unblock: 'api/unblock.json',
      search: 'api/servicos.json',
      pay: 'api/pay.json',
    }
  };

  var salonData = {};
  var openTooltipId;

  var messages= {
    config: {
      danger: "Erro ao carregar os dados do salão."
    },
    day: {
      danger: "Erro ao carregar os agendamentos do dia."
    },
    save: {
      danger: "Erro ao salvar o agendamento.",
      success: "Agendamento salvo com sucesso"
    },
    block: {
      danger: "Erro ao bloquear o horário.",
      success: "Horário bloqueado com sucesso"
    },
    unblock: {
      danger: "Erro ao desbloquear o horário.",
      success: "Horário desbloqueado com sucesso"
    },
    search: {
      danger: "Erro ao buscar os serviços."
    },
    pay: {
      danger: "Erro ao registrar pagamento.",
      success: "Pagamento registrado com sucesso"
    }

  }

  function init() {
    loadConfig();
    saveAppointment();
    blockHour();
    unBlockHour();
    searchClient();
    resetSearch();
    payServices();
  }

  function message (section, type) {
    var html = [
    '<div class="alert alert-' + type + ' alert-dismissable alert-hidden">',
    '<a class="close" data-dismiss="alert" href="#">&times;</a>',
      messages[section][type],
    '</div>'
    ].join('')
    $('#messages').append(html);
    $('#messages .alert-hidden').slideDown().delay(2000).slideUp('fast', function () {
      $(this).remove()
    });
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
        .removeClass('hour-block')
        .css('background', salonData.specialties[appointment.specialtie].color )
    });
  }

  function horario () {
    $('td').on('click', function () {
      var client = {};
      var name = $(this).find('.appointment-name').data('name');
      var phone = $(this).find('.appointment-phone').data('phone');
      var specialtie = $(this).find('.appointment-specialtie').data('specialtie');
      var hour = $(this).data('hour');
      client.name = name || '';
      client.phone = phone || '';
      client.specialtie = specialtie || '';
      var hasAppointment = (name == null ? false : true);
      var id = $(this).data('professional');
      var isblocked = ( $(this).hasClass('hour-block') ? 'blockedHour' : 'unblockedHour' );
      var htmlPopover = '<div class="col-md-12">'+
            '<form class="form-horizontal ' + ' ' + isblocked + ' ' + (hasAppointment ? 'hasAppointment' : 'hasNoAppointment') +'" role="form">'+
              '<input type="hidden" name="hour" value="' + hour + '">'+
              '<div class="form-group">'+
                '<label for="inputEmail3" class="col-sm-4 control-label">Serviço</label>'+
                '<div class="col-sm-8">'+
                  '<select class="form-control appointment-specialtie" name="specialtie">'+
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
                '<label class="col-sm-4 control-label">Duração</label>'+
                '<div class="col-sm-8">'+
                  '<select class="form-control appointment-duration" name="duration">'+
                  '<option value="1">30 minutos</opntion>'+
                  '<option value="2">1 hora</opntion>'+
                  '</select>'+
                '</div>'+
              '</div>'+
              '<div class="form-group">'+
                '<label for="inputEmail3" class="col-sm-4 control-label">Nome</label>'+
                '<div class="col-sm-8">'+
                  '<input type="text" name="name" class="form-control appointment-name" placeholder="Nome" value="' + client.name + '">'+
                '</div>'+
              '</div>'+
              '<div class="form-group">'+
                '<label for="inputEmail3" class="col-sm-4 control-label">Telefone</label>'+
                '<div class="col-sm-8">'+
                  '<input type="text" name="phone" class="form-control appointment-phone" placeholder="Telefone"  value="' + client.phone + '">'+
                '</div>'+
              '</div>'+
              '<div class="form-group">'+
                '<input class="btn btn-primary dismiss-appointment" style="margin-bottom:5px" type="button" value="Desmarcar">' +
                '<input class="btn btn-primary save-appointment" style="margin-bottom:5px" type="button" value="Agendar">' +
                '<button class="btn btn-inverse block-hour" style="margin-bottom:5px" type="button">Bloquear horário</button>' +
                '<button class="btn btn-inverse unblock-hour" style="margin-bottom:5px" type="button">Desbloquear horário</button>' +
              '</div>'+
            '</form>'+
          '</div>';

      var hasPopover = $(this).data('popover');
      if( !hasPopover ){
        $(this).data('popover', true)
        $(this).uniqueId();
        openTooltipId = '#'+$(this).attr('id');
        $(openTooltipId).popover({
            title: salonData.professionals[id].name + '<span class="close close-popover">&times;</span>',
            html: true,
            placement: 'top',
            container: 'body',
            content: htmlPopover
        });
        $(openTooltipId).popover('show');
      }
    });
    $('html').on('click', '.close-popover', function (e) {
        $(openTooltipId).popover('hide');
    });
  }

  function saveAppointment() {
    $('.save-appointment, .dismiss-appointment').live('click', function () {
      var isDismiss = $(this).hasClass('dismiss-appointment');
      var $form = $(this).parents('form');
      $.ajax({
        type: "POST",
        url: config.api.save,
        data: $form.serialize(),
        success: function () {
          updateAppointment($form, isDismiss);
        },
        error: function () {
          message('save', 'danger');
        }
      });
    });
  }

  function updateAppointment($form, isDismiss) {
    var name = $form.find('.appointment-name').val();
    var phone = $form.find('.appointment-phone').val();
    var specialtie = $form.find('.appointment-specialtie').val();
    var duration = parseInt($form.find('.appointment-duration').val(), 10);
    if(isDismiss){
      $(openTooltipId).html('')
          .css('background', '#fff');
    }else{
      var $td = $(openTooltipId);
      $td.html(
            '<span class="appointment-name" data-name="' + name + '">' + name.split(' ')[0]  + '</span>' +
            '<span class="appointment-specialtie" data-specialtie="' + specialtie + '">' + salonData.specialties[specialtie].small + '</span>' +
            '<span class="appointment-phone" data-phone="' + phone + '">' + phone  + '</span>'
          )
          .removeClass('hour-block')
          .css('background', salonData.specialties[specialtie].color );
      for (var i = 1; i < duration; i++) {
        $td = $(openTooltipId).next('td');
        $td.html(
              '<span class="appointment-name" data-name="' + name + '">' + name.split(' ')[0]  + '</span>' +
              '<span class="appointment-specialtie" data-specialtie="' + specialtie + '">' + salonData.specialties[specialtie].small + '</span>' +
              '<span class="appointment-phone" data-phone="' + phone + '">' + phone  + '</span>'
            )
            .removeClass('hour-block')
            .css('background', salonData.specialties[specialtie].color );
      };
    }
    $(openTooltipId).popover('destroy');
    $(openTooltipId).data('popover', false)
    message('save', 'success');
  }

  // envio o que para block? dia/hora?
  function blockHour() {
    $('.block-hour').live('click', function () {
      $.ajax({
        type: "POST",
        url: config.api.block,
        data: 'aa',
        success: function () {
          // updateAppointment($form);
          $(openTooltipId).empty().addClass('hour-block');
          $(openTooltipId).popover('destroy');
          $(openTooltipId).data('popover', false)
          message('block', 'success');
        },
        error: function () {
          message('block', 'danger');
        }
      });
    });
  }

  function unBlockHour() {
    $('.unblock-hour').live('click', function () {
      $.ajax({
        type: "POST",
        url: config.api.unblock,
        data: 'aa',
        success: function () {
          $(openTooltipId).empty().removeClass('hour-block');
          $(openTooltipId).popover('destroy');
          $(openTooltipId).data('popover', false)
          message('unblock', 'success');
        },
        error: function () {
          message('unblock', 'danger');
        }
      });
    });
  }

  // o termo de busca vai ser sempre exato? select?
  function searchClient () {
    $('#search-client').on('submit', function (evt) {
      evt.preventDefault();
      $('#list-services-table').slideUp();
      var clienName = $('#search-cliente-name').val();
      $.ajax({
        type: "POST",
        url: config.api.search,
        data: {query: clienName },
        success: function (data) {
            listServices(data);
        },
        error: function () {
          message('search', 'danger');
        }
      });
    });
  }

  function listServices (services) {
    var htmlServices = '';
    var servicesTotal = 0;
    $.each(services, function(index, service) {
      servicesTotal += service.price;
       htmlServices += '<tr>'+
          '<td>' + salonData.specialties[service.specialtie].name + '</td>'+
          '<td>' + salonData.professionals[service.professional].name + '</td>'+
          '<td class="text-right">' + accounting.formatMoney(service.price, "R$ ", 2, ".", ",") + '</td>'+
          '<td class="text-right"><button id="services-pay" type="button" class="btn btn-primary btn-xs services-pay">Pagar</button></td>'+
        '</tr>';
    });
    $('#list-services').html(htmlServices);
    $('#services-total').html(accounting.formatMoney(servicesTotal, "R$ ", 2, ".", ","));
    $('#list-services-table').slideDown();
  }

  function resetSearch () {
    $('#reset-search').on('click',function(event) {
      event.preventDefault();
      $('#list-services-table').slideUp('fast', function () {
        $('#list-services').html('');
      });
    });
  }

  // ID vem de onde? o termo de busca vai ser sempre exato? select?
  function payServices () {
    $('#services-pay, .services-pay').live('click', function () {
      var $btn = $(this);
       $.getJSON( config.api.pay, function( data ) {
          message('pay', 'success');
          $btn.text('pago').addClass('btn-info')
        }).fail(function() {
          message('pay', 'danger');
        });
    })
  }

  return {
    init:init
  };

}());

$(document).ready(function() {
  agenda.init();
});
