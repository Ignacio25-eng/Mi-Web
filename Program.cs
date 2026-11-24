// Servidor local mínimo para abrir la web con F5 desde Visual Studio.
// Sirve los archivos de la raíz del proyecto (index.html, etc.) tal cual.
var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    WebRootPath = "."
});

var app = builder.Build();

app.UseDefaultFiles();   // "/" abre index.html
app.UseStaticFiles();

app.Run();
