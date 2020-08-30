$(document).ready(function () {
    $('#shippingPrice').DataTable({
        "pageLength": 7,
        "lengthMenu": false,
        "info": false,
        "searching": false,
        "language": {
            "lengthMenu": "",
            "zeroRecords": "No se encontró nada",
            "emptyTable": "No hay datos disponibles en esta tabla",
            "info": "Mostrando página _PAGE_ de _PAGES_",
            "infoEmpty": "No hay registros disponibles",
            "infoFiltered": "(Filtrado de un total de _MAX_ registros)",
            "thousands": ".",
            "decimal": ",",
            "loadingRecords": "Cargando...",
            "processing": "Procesando...",
            "paginate": {
                "first":      "Primero",
                "last":       "Último",
                "next":       "->",
                "previous":   "<-"
            },
            "aria": {
                "sortAscending":  ": activar para organizar columna de forma ascendiente",
                "sortDescending": ": activar para organizar columna de forma descendiente"
            }
        },
        "columnDefs": [
            {
                "orderable": false,
                "targets": [0]
            }
        ],
        "order": [[ 1, "asc" ]]
    });
});
