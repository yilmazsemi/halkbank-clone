using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using Google.Cloud.Firestore;
using Google.Cloud.Firestore.V1;
using Microsoft.Extensions.Configuration;

var builder = WebApplication.CreateBuilder(args);

// CORS politikasý için isim
var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

// Servisleri ekle
builder.Services.AddControllers();

// CORS servisi
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
        policy =>
        {
            // GELÝÞTÝRME ORTAMI ÝÇÝN GEÇÝCÝ OLARAK TÜM KAYNAKLARA ÝZÝN VERÝLDÝ
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Firebase konfigürasyon deðerleri appsettings.json'dan oku
var firebaseProjectId = builder.Configuration.GetValue<string>("Firebase:ProjectId") ?? "";
var firebaseServiceAccountKeyPath = builder.Configuration.GetValue<string>("Firebase:ServiceAccountKeyPath") ?? "";

// Firebase key dosyasýnýn tam yolu
var fullFirebaseKeyPath = Path.Combine(Directory.GetCurrentDirectory(), firebaseServiceAccountKeyPath);

Console.WriteLine($"Firebase key dosyasý aranýyor: {fullFirebaseKeyPath}");

if (!File.Exists(fullFirebaseKeyPath))
{
    Console.WriteLine($"Firebase key dosyasý bulunamadý: {fullFirebaseKeyPath}");
    Console.WriteLine("Keys klasörü içeriði:");
    var keysDir = Path.Combine(Directory.GetCurrentDirectory(), "Keys");
    if (Directory.Exists(keysDir))
    {
        foreach (var file in Directory.GetFiles(keysDir))
        {
            Console.WriteLine($"  - {Path.GetFileName(file)}");
        }
    }
    else
    {
        Console.WriteLine("Keys klasörü bulunamadý!");
    }
    throw new FileNotFoundException("Firebase key dosyasý bulunamadý.");
}

try
{
    // Credential oluþtur
    var credential = GoogleCredential.FromFile(fullFirebaseKeyPath);

    // FirebaseApp baþlat
    FirebaseApp.Create(new AppOptions()
    {
        Credential = credential,
        ProjectId = firebaseProjectId
    });

    // FirestoreDb servisini credential ile birlikte oluþtur ve ekle
    builder.Services.AddSingleton<FirestoreDb>(provider =>
    {
        return FirestoreDb.Create(firebaseProjectId, new FirestoreClientBuilder
        {
            Credential = credential
        }.Build());
    });

    Console.WriteLine("Firebase baþarýyla yapýlandýrýldý!");
}
catch (Exception ex)
{
    Console.WriteLine($"Firebase yapýlandýrma hatasý: {ex.Message}");
    throw;
}

var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

// Development ortamýnda Swagger
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// CORS middleware en baþta
app.UseCors(MyAllowSpecificOrigins);

// HTTPS yönlendirmesi kaldýrýldý
// app.UseHttpsRedirection(); // yorumda veya kaldýrýlmýþ

app.UseAuthorization();

// Ýstek loglama middleware
app.Use(async (context, next) =>
{
    Console.WriteLine($"Ýstek: {context.Request.Method} {context.Request.Path}");
    await next();
});

app.MapControllers();
app.MapFallbackToFile("/index.html");

// Sadece HTTP portunda dinle
app.Urls.Add("http://localhost:5090");

Console.WriteLine("Sunucu baþlatýlýyor...");
Console.WriteLine("API endpoint'leri:");
Console.WriteLine("  POST /api/Firebase/login");
Console.WriteLine("  GET  /api/Firebase/accounts");
Console.WriteLine("  GET  /api/Firebase/accounts/{iban}");
Console.WriteLine("  POST /api/Firebase/transfer");

app.Run();
