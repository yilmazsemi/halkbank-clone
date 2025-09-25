using Microsoft.AspNetCore.Mvc;
using Google.Cloud.Firestore;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace halkbank_clone.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FirebaseController : ControllerBase
    {
        private readonly FirestoreDb _firestoreDb;
        private readonly ILogger<FirebaseController> _logger;

        public FirebaseController(FirestoreDb firestoreDb, ILogger<FirebaseController> logger)
        {
            _firestoreDb = firestoreDb;
            _logger = logger;
        }

        // Kullanıcı login (TCKN + Şifre doğrulaması yapılıyor - Hashing YOK)
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.TCKN) || string.IsNullOrWhiteSpace(request.Password))
                return BadRequest(new { message = "TCKN ve Şifre zorunludur." });

            try
            {
                var userDocRef = _firestoreDb.Collection("users").Document(request.TCKN);
                var userSnapshot = await userDocRef.GetSnapshotAsync();

                if (!userSnapshot.Exists)
                    return Unauthorized(new { message = "Kullanıcı bulunamadı veya şifre hatalı." });

                var storedPassword = userSnapshot.GetValue<string>("passwordHash");

                if (storedPassword != request.Password)
                    return Unauthorized(new { message = "Kullanıcı bulunamadı veya şifre hatalı." });

                var accountsQuery = _firestoreDb.Collection("accounts").WhereEqualTo("tckn", request.TCKN);
                var accountsSnapshot = await accountsQuery.GetSnapshotAsync();

                if (accountsSnapshot.Count == 0)
                    return NotFound(new { message = "Kullanıcıya ait hesap bulunamadı." });

                var accountDoc = accountsSnapshot.Documents.First();

                var now = Timestamp.GetCurrentTimestamp();
                await userDocRef.UpdateAsync("lastLogin", now);
                await accountDoc.Reference.UpdateAsync("lastLogin", now);

                var userInfo = userSnapshot.ToDictionary();

                return Ok(new
                {
                    message = "Giriş başarılı",
                    userTckn = request.TCKN,
                    account = new
                    {
                        iban = accountDoc.Id,
                        balance = accountDoc.GetValue<double>("balance"),
                        accountType = accountDoc.GetValue<string>("accountType"),
                        tckn = accountDoc.GetValue<string>("tckn")
                    },
                    user = userInfo
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Login sırasında hata oluştu");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // IBAN'a göre hesap bilgisi alma
        [HttpGet("accounts/{iban}")]
        public async Task<IActionResult> GetAccountByIban(string iban)
        {
            try
            {
                var doc = await _firestoreDb.Collection("accounts").Document(iban).GetSnapshotAsync();
                if (!doc.Exists)
                    return NotFound(new { message = "Hesap bulunamadı." });

                return Ok(new
                {
                    iban = doc.Id,
                    tckn = doc.GetValue<string>("tckn"),
                    balance = doc.GetValue<double>("balance"),
                    accountType = doc.GetValue<string>("accountType"),
                    createdAt = doc.TryGetValue<Timestamp>("createdAt", out var createdAt) ? createdAt.ToDateTime().ToString("o") : null,
                    lastLogin = doc.TryGetValue<Timestamp>("lastLogin", out var lastLogin) ? lastLogin.ToDateTime().ToString("o") : null
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Hesap sorgulama hatası");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // Tüm hesapları listele veya belirli bir TCKN'ye göre filtrele
        [HttpGet("accounts")]
        public async Task<IActionResult> GetAllAccounts([FromQuery] string? tckn = null)
        {
            try
            {
                _logger.LogInformation($"GetAllAccounts isteği alındı. TCKN: {tckn ?? "Tümü"}");

                Query accountsQuery = _firestoreDb.Collection("accounts");

                if (!string.IsNullOrEmpty(tckn))
                {
                    accountsQuery = accountsQuery.WhereEqualTo("tckn", tckn);
                    _logger.LogInformation($"Hesaplar TCKN {tckn} ile filtreleniyor.");
                }

                var snapshot = await accountsQuery.GetSnapshotAsync();
                _logger.LogInformation($"Firestore'dan {snapshot.Documents.Count} hesap belgesi çekildi.");

                var accounts = new List<object>();
                foreach (var doc in snapshot.Documents)
                {
                    doc.TryGetValue("tckn", out string accountTckn);
                    string accountHolderName = "Bilinmeyen";

                    if (!string.IsNullOrEmpty(accountTckn))
                    {
                        var userDoc = await _firestoreDb.Collection("users").Document(accountTckn).GetSnapshotAsync();
                        if (userDoc.Exists)
                        {
                            userDoc.TryGetValue("name", out string name);
                            userDoc.TryGetValue("surname", out string surname);

                            accountHolderName = $"{name ?? ""} {surname ?? ""}".Trim();
                            if (string.IsNullOrEmpty(accountHolderName))
                                accountHolderName = "Bilinmeyen";

                            _logger.LogInformation($"TCKN {accountTckn} için kullanıcı adı bulundu: {accountHolderName}");
                        }
                        else
                        {
                            _logger.LogWarning($"TCKN {accountTckn} için kullanıcı belgesi bulunamadı.");
                        }
                    }
                    else
                    {
                        _logger.LogWarning($"Hesap belgesi {doc.Id} için TCKN alanı boş veya eksik.");
                    }

                    accounts.Add(new
                    {
                        iban = doc.Id,
                        tckn = accountTckn,
                        balance = doc.GetValue<double>("balance"),
                        accountType = doc.GetValue<string>("accountType"),
                        accountHolder = accountHolderName
                    });
                }
                _logger.LogInformation($"Döndürülecek hesap sayısı: {accounts.Count}");
                return Ok(accounts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Hesaplar çekilirken hata oluştu");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("users/{tckn}")]
        public async Task<IActionResult> GetUserByTckn(string tckn)
        {
            try
            {
                var docRef = _firestoreDb.Collection("users").Document(tckn);
                var snapshot = await docRef.GetSnapshotAsync();

                if (!snapshot.Exists)
                {
                    _logger.LogWarning($"Kullanıcı bulunamadı: TCKN = {tckn}");
                    return NotFound(new { message = "Kullanıcı bulunamadı." });
                }

                // ToDictionary() kullanarak veriyi al. Bu, Dictionary<string, object> döndürür,
                // ve object türü null olabilen bir türdür, bu yüzden doğrudan null ataması sorun çıkarmaz.
                var data = snapshot.ToDictionary();

                // TCKN'yi doğrudan döndürülen veriye ekleyin
                data["tckn"] = tckn;

                // createdAt alanı varsa Timestamp'ten string'e çevir
                // TryGetValue ile object alınıp, sonra cast edilmesi ve null kontrolü güvenli yoldur.
                if (data.TryGetValue("createdAt", out object? createdAtRaw) && createdAtRaw is Timestamp createdAtTimestamp)
                {
                    // ISO 8601 formatı ("o" format specifier) ile döndür
                    // Bu format frontend'de new Date() tarafından daha güvenli ayrıştırılır.
                    data["createdAt"] = createdAtTimestamp.ToDateTime().ToString("o");
                }
                else
                {
                    data["createdAt"] = null; // Eğer createdAt yoksa veya Timestamp değilse null bırak
                }

                // phoneNumber alanı varsa string olarak al, yoksa null bırak
                if (data.TryGetValue("phoneNumber", out object? phoneNumberRaw) && phoneNumberRaw != null)
                {
                    data["phoneNumber"] = phoneNumberRaw.ToString();
                }
                else
                {
                    data["phoneNumber"] = null; // Eğer phoneNumber yoksa null bırak
                }

                // Diğer tüm alanların da (name, surname, email, address vb.)
                // null olabileceği düşünülerek benzer şekilde kontrol edilip atandığından emin olun.
                // Örneğin:
                if (data.TryGetValue("name", out object? nameRaw)) data["name"] = nameRaw?.ToString(); else data["name"] = null;
                if (data.TryGetValue("surname", out object? surnameRaw)) data["surname"] = surnameRaw?.ToString(); else data["surname"] = null;
                if (data.TryGetValue("email", out object? emailRaw)) data["email"] = emailRaw?.ToString(); else data["email"] = null;
                if (data.TryGetValue("address", out object? addressRaw)) data["address"] = addressRaw?.ToString(); else data["address"] = null;
                // passwordHash ve lastLogin gibi hassas veya dahili alanları döndürmekten kaçınmak iyi bir güvenlik pratiğidir.
                if (data.ContainsKey("passwordHash")) data.Remove("passwordHash");
                if (data.ContainsKey("lastLogin")) data.Remove("lastLogin");


                _logger.LogInformation($"Kullanıcı bilgileri başarıyla çekildi: TCKN = {tckn}");
                return Ok(data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Kullanıcı bilgisi sorgulanırken hata oluştu: TCKN = {tckn}");
                return StatusCode(500, new { message = "Sunucu hatası: " + ex.Message, detail = ex.ToString() });
            }
        }

        // Para transferi
        [HttpPost("transfer")]
        public async Task<IActionResult> TransferBetweenIbans([FromBody] TransferRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.FromIban) || string.IsNullOrWhiteSpace(request.ToIban))
                return BadRequest(new { message = "Gönderen ve alıcı IBAN zorunludur." });

            if (request.Amount <= 0)
                return BadRequest(new { message = "Transfer tutarı pozitif olmalıdır." });

            if (request.FromIban == request.ToIban)
                return BadRequest(new { message = "Aynı IBAN'a transfer yapılamaz." });

            try
            {
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(30));

                var result = await _firestoreDb.RunTransactionAsync(async transaction =>
                {
                    var fromRef = _firestoreDb.Collection("accounts").Document(request.FromIban);
                    var toRef = _firestoreDb.Collection("accounts").Document(request.ToIban);

                    var fromSnap = await transaction.GetSnapshotAsync(fromRef);
                    var toSnap = await transaction.GetSnapshotAsync(toRef);

                    if (!fromSnap.Exists)
                        throw new Exception("Gönderen hesabı bulunamadı.");
                    if (!toSnap.Exists)
                        throw new Exception("Alıcı hesabı bulunamadı.");

                    var fromBalance = fromSnap.GetValue<double>("balance");
                    if (fromBalance < request.Amount)
                        throw new Exception("Yetersiz bakiye.");

                    var toBalance = toSnap.GetValue<double>("balance");

                    transaction.Update(fromRef, "balance", fromBalance - request.Amount);
                    transaction.Update(toRef, "balance", toBalance + request.Amount);

                    var transferData = new Dictionary<string, object>
                    {
                        { "FromIban", request.FromIban },
                        { "ToIban", request.ToIban },
                        { "Amount", request.Amount },
                        { "Description", request.Description },
                        { "TransferDate", FieldValue.ServerTimestamp },
                        { "Status", "Completed" }
                    };

                    var transferRef = _firestoreDb.Collection("transfers").Document();
                    transaction.Set(transferRef, transferData);

                    return new
                    {
                        success = true,
                        transferId = transferRef.Id,
                        message = "Transfer başarıyla tamamlandı."
                    };
                }, cancellationToken: cts.Token);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Transfer hatası");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // Transfer geçmişini getiren endpoint
        [HttpGet("transfers")]
        public async Task<IActionResult> GetAllTransfers()
        {
            try
            {
                _logger.LogInformation("GetAllTransfers isteği alındı.");
                var snapshot = await _firestoreDb.Collection("transfers").GetSnapshotAsync();
                _logger.LogInformation($"Firestore'dan {snapshot.Documents.Count} transfer belgesi çekildi.");

                var transfers = new List<object>();
                foreach (var doc in snapshot.Documents)
                {
                    transfers.Add(new
                    {
                        id = doc.Id,
                        fromIban = doc.GetValue<string>("FromIban"),
                        toIban = doc.GetValue<string>("ToIban"),
                        amount = doc.GetValue<double>("Amount"),
                        description = doc.GetValue<string>("Description"),
                        transferDate = doc.TryGetValue<Timestamp>("TransferDate", out var ts) ? ts.ToDateTime().ToString("o") : null,
                        status = doc.GetValue<string>("Status")
                    });
                }
                _logger.LogInformation($"Döndürülecek transfer sayısı: {transfers.Count}");
                return Ok(transfers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Transfer geçmişi çekilirken hata oluştu");
                return StatusCode(500, new { message = ex.Message });
            }
        }


        // YENİ EKLENEN: Kullanıcı Profili Güncelleme (PUT)
        [HttpPut("users/{tckn}")]
        public async Task<IActionResult> UpdateUser(string tckn, [FromBody] UserUpdateRequest request)
        {
            try
            {
                var userDocRef = _firestoreDb.Collection("users").Document(tckn);
                var userSnapshot = await userDocRef.GetSnapshotAsync();

                if (!userSnapshot.Exists)
                {
                    _logger.LogWarning($"Kullanıcı güncellenirken bulunamadı: TCKN = {tckn}");
                    return NotFound(new { message = "Kullanıcı bulunamadı." });
                }

                // Firestore'a gönderilecek verileri hazırla
                var updates = new Dictionary<string, object>();

                // Sadece gelen veriler null değilse güncelleme listesine ekle
                if (request.Name != null) updates["name"] = request.Name;
                if (request.Surname != null) updates["surname"] = request.Surname;
                if (request.Email != null) updates["email"] = request.Email;
                if (request.PhoneNumber != null) updates["phoneNumber"] = request.PhoneNumber;
                if (request.Address != null) updates["address"] = request.Address;

                if (updates.Count > 0)
                {
                    await userDocRef.UpdateAsync(updates);
                    _logger.LogInformation($"Kullanıcı bilgileri başarıyla güncellendi: TCKN = {tckn}");

                    // Güncellenmiş veriyi tekrar çekip döndürmek daha güvenlidir
                    var updatedSnapshot = await userDocRef.GetSnapshotAsync();
                    var updatedData = updatedSnapshot.ToDictionary();
                    updatedData["tckn"] = tckn; // TCKN'yi manuel ekle

                    // createdAt alanını formatla (frontend'in beklediği formatta)
                    if (updatedData.TryGetValue("createdAt", out object? createdAtRaw) && createdAtRaw is Timestamp createdAtTimestamp)
                    {
                        updatedData["createdAt"] = createdAtTimestamp.ToDateTime().ToString("o");
                    }
                    else
                    {
                        updatedData["createdAt"] = null;
                    }

                    // passwordHash ve lastLogin gibi hassas veya dahili alanları döndürmekten kaçınmak
                    if (updatedData.ContainsKey("passwordHash")) updatedData.Remove("passwordHash");
                    if (updatedData.ContainsKey("lastLogin")) updatedData.Remove("lastLogin");

                    return Ok(updatedData); // Güncellenmiş kullanıcı verisini geri gönder
                }
                else
                {
                    return BadRequest(new { message = "Güncellenecek veri bulunamadı." });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Kullanıcı güncellenirken hata oluştu: TCKN = {tckn}");
                return StatusCode(500, new { message = "Sunucu hatası: " + ex.Message, detail = ex.ToString() });
            }
        }
    }

    public class LoginRequest
    {
        public string TCKN { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class TransferRequest
    {
        public string FromIban { get; set; } = string.Empty;
        public string ToIban { get; set; } = string.Empty;
        public double Amount { get; set; }
        public string Description { get; set; } = string.Empty;
    }

    // YENİ EKLENEN: Kullanıcı güncelleme isteği için model
    public class UserUpdateRequest
    {
        public string? Name { get; set; }
        public string? Surname { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; } // Frontend'den gelen alan adı "phoneNumber"
        public string? Address { get; set; }
    }
}
