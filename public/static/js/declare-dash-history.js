$(document).ready(function () {
    $('#orderSummary').DataTable({
        "searching": false,
        "paging": false,
        "columnDefs": [
            {
                "orderable": false,
                "targets": [0, 1, 2, 3, 4, 5]
            }
        ],
        "order": [[ 1, "asc" ]],
        "language": {
            "lengthMenu": "Mostrando _MENU_ por página",
            "zeroRecords": "No se encontró nada",
            "emptyTable": "No hay datos disponibles en esta tabla",
            "info": "",
            "infoEmpty": "No hay registros disponibles",
            "infoFiltered": "(Filtrado de un total de _MAX_ registros)",
            "thousands": ".",
            "decimal": ",",
            "search": "Buscar:",
            "loadingRecords": "Cargando...",
            "processing": "Procesando...",
            "paginate": {
                "first":      "Primero",
                "last":       "Último",
                "next":       "Siguiente",
                "previous":   "Anterior"
            },
            "aria": {
                "sortAscending":  ": activar para organizar columna de forma ascendiente",
                "sortDescending": ": activar para organizar columna de forma descendiente"
            }
        }
    });
});
