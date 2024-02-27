using LightningDB;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace UnityTools
{
    public class UnityDBTool
    {
        public static Dictionary<string, string> UseUnityDataBaseGuidToFileSample(string filePath)
        {
            Dictionary<string, string> data = new Dictionary<string, string>();
            using var env = new LightningEnvironment(filePath);
            env.MaxDatabases = 10;
            env.Open(EnvironmentOpenFlags.NoSubDir, UnixAccessMode.Default);
            using (var tx = env.BeginTransaction(TransactionBeginFlags.ReadOnly))
            using (var db = tx.OpenDatabase("GuidToPath"))
            {
                foreach (var item in tx.CreateCursor(db).AsEnumerable())
                {
                    data.Add(LMDBBytesToGuidStr(item.Item1.AsSpan()), Encoding.UTF8.GetString(item.Item2.AsSpan()));
                }
            }
            env.Dispose();
            return data;
        }
        static byte[] GuidStrToLMDBBytes(string str)
        {
            string newGuid = "";
            int count = str.Length;
            for (int i = 0; i < count - 1; i += 2)
            {
                newGuid += str[i + 1].ToString() + str[i].ToString();
            }
            return Convert.FromHexString(newGuid);
        }
        static string LMDBBytesToGuidStr(ReadOnlySpan<byte> bytes)
        {
            string hexStr = BitConverter.ToString(bytes.ToArray()).Replace("-", "");
            string originalGuid = "";
            for (int i = 0; i < hexStr.Length; i += 2)
            {
                originalGuid += hexStr[i + 1].ToString() + hexStr[i].ToString();
            }
            return originalGuid.ToLower();
        }
    }
}
