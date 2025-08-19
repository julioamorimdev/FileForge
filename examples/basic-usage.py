"""
Exemplo básico de uso do FileForge em Python
"""

import asyncio
from fileforge import FileForge, ConversionOptions, BatchConversionOptions


async def exemplo_basico():
    """Exemplo básico de conversão"""
    print("🔥 FileForge - Exemplo Básico\n")
    
    forge = FileForge()
    
    try:
        # Conversão simples: PDF para texto
        print("Convertendo PDF para texto...")
        resultado = await forge.convert(
            'documento.pdf', 
            'txt',
            ConversionOptions(
                ocr=True,
                metadata=True
            )
        )
        
        if resultado.success:
            print("✅ Conversão bem-sucedida!")
            print(f"📄 Formato original: {resultado.original_format}")
            print(f"📄 Formato final: {resultado.output_format}")
            print(f"📊 Tamanho original: {format_bytes(resultado.original_size)}")
            print(f"📊 Tamanho final: {format_bytes(resultado.output_size or 0)}")
            print(f"⏱️  Tempo: {resultado.processing_time:.2f}s")
            
            if resultado.metadata:
                print("\n📋 Metadados:")
                print(f"  Formato: {resultado.metadata.format}")
                print(f"  Tamanho: {format_bytes(resultado.metadata.file_size)}")
                if resultado.metadata.document:
                    print(f"  Páginas: {resultado.metadata.document.get('page_count', 'N/A')}")
        else:
            print("❌ Erro na conversão:", resultado.errors)
            
    except Exception as e:
        print(f"❌ Erro: {e}")


async def exemplo_avancado():
    """Exemplo com opções avançadas"""
    print("\n🔥 FileForge - Exemplo Avançado\n")
    
    forge = FileForge()
    
    try:
        # Conversão com opções avançadas
        print("Convertendo imagem para PDF com OCR...")
        resultado = await forge.convert(
            'imagem.jpg', 
            'pdf',
            ConversionOptions(
                ocr=True,
                ocr_language='por',
                compression='high',
                image={
                    'resize': '1200x800',
                    'rotate': 90
                },
                metadata=True
            )
        )
        
        if resultado.success:
            print("✅ Conversão avançada bem-sucedida!")
            if resultado.output_path:
                print(f"💾 Arquivo salvo em: {resultado.output_path}")
                
    except Exception as e:
        print(f"❌ Erro: {e}")


async def exemplo_batch():
    """Exemplo de conversão em lote"""
    print("\n🔥 FileForge - Conversão em Lote\n")
    
    forge = FileForge()
    
    def on_progress(atual, total, arquivo):
        print(f"📄 Progresso: {atual}/{total} - {arquivo}")
    
    try:
        # Conversão em lote
        print("Convertendo múltiplos PDFs para Markdown...")
        resultado = await forge.convert_batch(
            ['*.pdf', 'documentos/*.pdf'],
            'md',
            BatchConversionOptions(
                output_dir='./convertidos',
                max_concurrency=3,
                continue_on_error=True,
                on_progress=on_progress
            )
        )
        
        print("\n📊 Resumo da conversão em lote:")
        print(f"📁 Total de arquivos: {resultado.total_files}")
        print(f"✅ Sucessos: {resultado.success_count}")
        print(f"❌ Erros: {resultado.error_count}")
        print(f"⏱️  Tempo total: {resultado.total_time:.2f}s")
        
    except Exception as e:
        print(f"❌ Erro: {e}")


async def exemplo_plugin():
    """Exemplo com plugin customizado"""
    print("\n🔥 FileForge - Plugin Customizado\n")
    
    from fileforge.core.types import Plugin
    
    class MeuPlugin(Plugin):
        @property
        def name(self):
            return 'meu-plugin'
        
        @property
        def version(self):
            return '1.0.0'
        
        @property
        def input_formats(self):
            return ['txt']
        
        @property
        def output_formats(self):
            return ['custom']
        
        async def convert(self, input_data, options):
            if isinstance(input_data, bytes):
                texto = input_data.decode('utf-8')
            else:
                texto = str(input_data)
            
            texto_maiusculo = texto.upper()
            resultado = f"CONVERTIDO PELO MEU PLUGIN:\n{texto_maiusculo}"
            return resultado.encode('utf-8')
    
    forge = FileForge()
    forge.add_plugin(MeuPlugin())
    
    try:
        resultado = await forge.convert('texto.txt', 'custom')
        
        if resultado.success:
            print("✅ Plugin customizado funcionou!")
            print(f"📄 Resultado: {resultado.data.decode('utf-8')}")
            
    except Exception as e:
        print(f"❌ Erro: {e}")


def format_bytes(bytes_size):
    """Formatar tamanho em bytes"""
    sizes = ['B', 'KB', 'MB', 'GB']
    if bytes_size == 0:
        return '0 B'
    
    import math
    i = math.floor(math.log(bytes_size) / math.log(1024))
    return f"{bytes_size / (1024 ** i):.1f} {sizes[i]}"


async def executar_exemplos():
    """Executar todos os exemplos"""
    await exemplo_basico()
    await exemplo_avancado()
    await exemplo_batch()
    await exemplo_plugin()
    
    print("\n🎉 Todos os exemplos foram executados!")


if __name__ == "__main__":
    asyncio.run(executar_exemplos())
